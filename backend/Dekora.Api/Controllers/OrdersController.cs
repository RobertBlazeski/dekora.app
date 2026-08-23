using Dekora.Api.Constants;
using Dekora.Api.Data;
using Dekora.Api.DTOs;
using Dekora.Api.Entities;
using Dekora.Api.Enums;
using Dekora.Api.Extensions;
using Dekora.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Dekora.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController(
    DekoraDbContext db,
    IOptions<BusinessRulesOptions> businessRulesOptions,
    INotificationSender notificationSender,
    IEmailSender emailSender,
    IOptions<FrontendOptions> frontendOptions) : ControllerBase
{
    private readonly BusinessRulesOptions _rules = businessRulesOptions.Value;

    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting("public-write")]
    public async Task<ActionResult<OrderDto>> Create(CreateOrderRequest request)
    {
        if (request.Items.Count == 0)
            return Problem("An order must contain at least one item.", statusCode: 400);

        var built = await BuildOrderItemsAsync(request.Items);
        if (built.Error is not null) return Problem(built.Error, statusCode: built.ErrorStatus);

        var customerId = User.GetUserId();
        ApplicationUser? customer = customerId is null
            ? null
            : await db.Users.FirstOrDefaultAsync(u => u.Id == customerId);

        var pointsSpent = 0;
        decimal pointsDiscount = 0;
        if (request.PointsToRedeem > 0)
        {
            if (customer is null)
                return Problem("Points can only be redeemed by a logged-in customer.", statusCode: 400);
            if (request.PointsToRedeem < _rules.PointsRedemptionMinimum)
                return Problem($"A minimum of {_rules.PointsRedemptionMinimum} points is required to redeem.", statusCode: 400);
            if (request.PointsToRedeem > customer.Points)
                return Problem("Not enough points.", statusCode: 400);

            pointsSpent = request.PointsToRedeem;
            pointsDiscount = pointsSpent * _rules.PointsRedemptionValue;
        }

        var deliveryFee = _rules.DeliveryFee;
        var total = Math.Max(0, built.Subtotal + deliveryFee - pointsDiscount);

        // Redeeming points tends to land on an odd, hard-to-make-change-for total (e.g. 997.40
        // ден) — since payment is cash-on-delivery, round it to the nearest 100 ден instead so
        // there's always a clean amount to hand over.
        if (pointsSpent > 0)
            total = Math.Round(total / 100m, MidpointRounding.AwayFromZero) * 100m;

        var pointsEarned = customer is not null
            ? (int)Math.Round(built.Subtotal * _rules.PointsEarnRate, MidpointRounding.AwayFromZero)
            : 0;

        var order = new Order
        {
            OrderNumber = await NextOrderNumberAsync(),
            CustomerId = customer?.Id,
            CustomerName = request.CustomerName,
            Phone = request.Phone,
            Email = request.Email ?? string.Empty,
            DeliveryCity = request.DeliveryCity,
            DeliveryAddress = request.DeliveryAddress,
            Subtotal = built.Subtotal,
            DeliveryFee = deliveryFee,
            PointsDiscount = pointsDiscount,
            Total = total,
            PointsEarned = pointsEarned,
            PointsSpent = pointsSpent,
            PaymentMethod = request.PaymentMethod,
            Status = OrderStatus.PendingConfirmation,
            Note = request.Note,
            Items = built.Items
        };

        db.Orders.Add(order);

        if (customer is not null)
            customer.Points = customer.Points - pointsSpent + pointsEarned;

        await db.SaveChangesAsync();
        await notificationSender.NotifyNewOrderAsync(order);

        var images = await BuildImageLookupAsync(order.Items);
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, ToDto(order, images));
    }

    // The owner logging a phone/in-person sale — contact details are optional and no
    // points/notification pipeline runs (there's no customer account behind it and the owner
    // doesn't need to be notified of an order they just typed in themselves), but pricing goes
    // through the exact same validation as a real checkout so revenue totals stay accurate.
    [HttpPost("manual")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<OrderDto>> CreateManual(CreateManualOrderRequest request)
    {
        if (request.Items.Count == 0)
            return Problem("An order must contain at least one item.", statusCode: 400);

        var built = await BuildOrderItemsAsync(request.Items);
        if (built.Error is not null) return Problem(built.Error, statusCode: built.ErrorStatus);

        // Manual orders (phone/in-person sales) almost always go out via an external courier
        // paid separately or free pickup, so unlike real checkout they never carry this app's
        // delivery fee.
        const decimal deliveryFee = 0m;
        var total = Math.Max(0, built.Subtotal + deliveryFee);

        var order = new Order
        {
            OrderNumber = await NextOrderNumberAsync(),
            CustomerId = null,
            CustomerName = request.CustomerName,
            Phone = request.Phone ?? string.Empty,
            Email = request.Email ?? string.Empty,
            DeliveryCity = request.DeliveryCity ?? string.Empty,
            DeliveryAddress = request.DeliveryAddress ?? string.Empty,
            Subtotal = built.Subtotal,
            DeliveryFee = deliveryFee,
            PointsDiscount = 0,
            Total = total,
            PointsEarned = 0,
            PointsSpent = 0,
            PaymentMethod = request.PaymentMethod,
            Status = request.InitialStatus,
            Note = request.Note,
            IsManualEntry = true,
            Items = built.Items
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var manualImages = await BuildImageLookupAsync(order.Items);
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, ToDto(order, manualImages));
    }

    [HttpGet("mine")]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<OrderDto>>> GetMine()
    {
        var customerId = User.GetUserId();
        if (customerId is null) return Unauthorized();

        var orders = await db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var images = await BuildImageLookupAsync(orders.SelectMany(o => o.Items));
        return Ok(orders.Select(o => ToDto(o, images)).ToList());
    }

    [HttpGet]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<IReadOnlyList<OrderSummaryDto>>> GetAll(
        [FromQuery] OrderStatus? status, [FromQuery] string? search)
    {
        var query = db.Orders.AsNoTracking().AsQueryable();

        if (status is not null)
            query = query.Where(o => o.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(o =>
                o.OrderNumber.Contains(search) ||
                o.CustomerName.Contains(search) ||
                o.Phone.Contains(search));

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderSummaryDto(
                o.Id, o.OrderNumber, o.CustomerName, o.Subtotal, o.Total, o.Status, o.IsManualEntry, o.ViewedByAdminAt != null, o.CreatedAt))
            .ToListAsync();

        return Ok(orders);
    }

    // Drives the "orders you missed" toast stack shown right after the owner logs in, and the
    // navbar badge — manual entries are excluded since the owner created those themselves and
    // was obviously already aware of them.
    [HttpGet("unviewed")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<IReadOnlyList<OrderSummaryDto>>> GetUnviewed()
    {
        var orders = await db.Orders
            .AsNoTracking()
            .Where(o => o.ViewedByAdminAt == null && !o.IsManualEntry)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderSummaryDto(
                o.Id, o.OrderNumber, o.CustomerName, o.Subtotal, o.Total, o.Status, o.IsManualEntry, false, o.CreatedAt))
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("unviewed-count")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<int>> GetUnviewedCount()
    {
        var count = await db.Orders.CountAsync(o => o.ViewedByAdminAt == null && !o.IsManualEntry);
        return Ok(count);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<OrderDto>> GetById(Guid id)
    {
        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return NotFound();

        if (order.ViewedByAdminAt is null)
        {
            order.ViewedByAdminAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
        }

        var images = await BuildImageLookupAsync(order.Items);
        return Ok(ToDto(order, images));
    }

    // Mainly for cleaning up test orders made while trying out the storefront — reverses any
    // points this order earned/spent before removing it, so deleting a test order never leaves
    // a customer's real point balance permanently skewed by it. Items cascade-delete with the
    // order (see DekoraDbContext).
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return NotFound();

        if (order.CustomerId is not null)
        {
            var customer = await db.Users.FindAsync(order.CustomerId.Value);
            if (customer is not null)
                customer.Points = customer.Points - order.PointsEarned + order.PointsSpent;
        }

        db.Orders.Remove(order);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> UpdateStatus(Guid id, UpdateOrderStatusRequest request)
    {
        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return NotFound();

        var wasDelivered = order.Status == OrderStatus.Delivered;
        order.Status = request.Status;
        order.StatusUpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        // Fire the "leave a review" nudge exactly once, the moment an order first becomes
        // Delivered — not on every subsequent save, and not for manual/guest orders that have
        // no account to review from or no email to reach.
        if (!wasDelivered && request.Status == OrderStatus.Delivered && !order.IsManualEntry && !string.IsNullOrWhiteSpace(order.Email))
        {
            // Reviews don't require being logged in (see ReviewsController), so this links
            // straight to the product page — where the star row is always clickable — rather
            // than the profile, which used to be the only place eligible reviewers could reach it.
            var firstProductId = order.Items.FirstOrDefault()?.ProductId;
            var reviewLink = firstProductId is null
                ? $"{frontendOptions.Value.BaseUrl.TrimEnd('/')}/mk/shop"
                : $"{frontendOptions.Value.BaseUrl.TrimEnd('/')}/mk/product/{firstProductId}";
            var itemNames = string.Join(", ", order.Items.Select(i => i.ProductNameSnapshot).Distinct());
            await emailSender.SendAsync(
                order.Email,
                $"How was your order, {order.CustomerName}?",
                $"""
                <p>Hi {System.Net.WebUtility.HtmlEncode(order.CustomerName)},</p>
                <p>Your order {System.Net.WebUtility.HtmlEncode(order.OrderNumber)} ({System.Net.WebUtility.HtmlEncode(itemNames)}) has been delivered — we hope you love it!</p>
                <p>If you have a moment, we'd really appreciate a quick rating:</p>
                <p><a href="{reviewLink}">{reviewLink}</a></p>
                """);
        }

        return NoContent();
    }

    // A Postgres sequence, not "count existing orders + 1" — the old count-based approach reads
    // and writes weren't atomic, so two checkouts landing in the same instant could both read the
    // same count and try to insert the same OrderNumber, and the second one would fail its
    // SaveChangesAsync with an unhandled unique-constraint violation. nextval() is inherently
    // concurrency-safe: every caller gets a distinct value with no locking/retry needed.
    private async Task<string> NextOrderNumberAsync()
    {
        var next = await db.Database.SqlQueryRaw<long>("SELECT nextval('order_number_seq') AS \"Value\"").SingleAsync();
        return $"DK-{next}";
    }

    private readonly record struct ItemBuildResult(List<OrderItem> Items, decimal Subtotal, string? Error, int ErrorStatus);

    // Shared by both Create and CreateManual — validates every line against the live product
    // (stock, price, sizes, colors, extras) and computes the priced OrderItem rows, so a manual
    // entry can never silently drift from the same pricing rules real checkout enforces.
    private async Task<ItemBuildResult> BuildOrderItemsAsync(List<CreateOrderItemRequest> itemRequests)
    {
        var items = new List<OrderItem>();
        decimal subtotal = 0;

        foreach (var itemRequest in itemRequests)
        {
            var product = await db.Products
                .Include(p => p.Sizes)
                .Include(p => p.ColorGroups).ThenInclude(g => g.Colors)
                .Include(p => p.Extras)
                .FirstOrDefaultAsync(p => p.Id == itemRequest.ProductId);

            if (product is null)
                return new ItemBuildResult([], 0, $"Product {itemRequest.ProductId} was not found.", 400);

            if (product.SoldOut)
                return new ItemBuildResult([], 0, $"'{product.Name}' is sold out.", 409);

            if (itemRequest.Quantity < 1)
                return new ItemBuildResult([], 0, $"Quantity for '{product.Name}' must be at least 1.", 400);

            var selectedColorSnapshots = new List<string>();
            if (itemRequest.SelectedColors is { Count: > 0 })
            {
                foreach (var choice in itemRequest.SelectedColors)
                {
                    var group = product.ColorGroups.FirstOrDefault(g => g.Name == choice.GroupName);
                    if (group is null)
                        return new ItemBuildResult([], 0, $"'{choice.GroupName}' is not a color group on '{product.Name}'.", 400);

                    var color = group.Colors.FirstOrDefault(c => c.Name == choice.ColorName);
                    if (color is null)
                        return new ItemBuildResult([], 0, $"'{choice.ColorName}' is not a valid {choice.GroupName} for '{product.Name}'.", 400);
                    if (color.SoldOut)
                        return new ItemBuildResult([], 0, $"'{product.Name}' in {choice.GroupName} '{choice.ColorName}' is sold out.", 409);

                    selectedColorSnapshots.Add($"{choice.GroupName}: {choice.ColorName}");
                }
            }

            decimal unitPrice;
            string? sizeSnapshot = itemRequest.SelectedSize;

            if (product.CustomSizeEnabled && itemRequest.CustomSizeQuantity is > 0)
            {
                unitPrice = (product.CustomSizeUnitPrice ?? 0) * itemRequest.CustomSizeQuantity.Value + (product.CustomSizeBaseFee ?? 0);
                sizeSnapshot = $"Custom ({itemRequest.CustomSizeQuantity} x {product.CustomSizeUnitLabel})";
            }
            else
            {
                unitPrice = product.DiscountedPrice ?? product.BasePrice;
                if (product.SizesEnabled && !string.IsNullOrWhiteSpace(itemRequest.SelectedSize))
                {
                    var size = product.Sizes.FirstOrDefault(s => s.Name == itemRequest.SelectedSize);
                    if (size is null)
                        return new ItemBuildResult([], 0, $"'{itemRequest.SelectedSize}' is not a valid size for '{product.Name}'.", 400);
                    unitPrice = size.DiscountedPrice ?? size.Price;
                }
            }

            var selectedExtras = new List<string>();
            if (product.ExtrasEnabled && itemRequest.SelectedExtras is { Count: > 0 })
            {
                foreach (var extraName in itemRequest.SelectedExtras)
                {
                    var extra = product.Extras.FirstOrDefault(x => x.Name == extraName);
                    if (extra is null)
                        return new ItemBuildResult([], 0, $"'{extraName}' is not a valid extra for '{product.Name}'.", 400);
                    unitPrice += extra.Price;
                    selectedExtras.Add(extraName);
                }
            }

            var lineTotal = unitPrice * itemRequest.Quantity;
            subtotal += lineTotal;

            items.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductNameSnapshot = product.Name,
                Quantity = itemRequest.Quantity,
                SelectedSize = sizeSnapshot,
                SelectedColors = selectedColorSnapshots,
                CustomText = itemRequest.CustomText,
                SelectedExtras = selectedExtras,
                UnitPrice = unitPrice,
                LineTotal = lineTotal
            });
        }

        return new ItemBuildResult(items, subtotal, null, 0);
    }

    // The order-details view (admin and customer profile alike) shows each item's product photo
    // so similarly-named products aren't mistaken for one another — this looks the image up by
    // ProductId at read time rather than storing it on OrderItem, since OrderItem otherwise only
    // stores immutable-at-order-time facts (name/price snapshots) and a photo doesn't need that
    // same historical-accuracy guarantee.
    private async Task<IReadOnlyDictionary<Guid, string?>> BuildImageLookupAsync(IEnumerable<OrderItem> items)
    {
        var productIds = items.Select(i => i.ProductId).Distinct().ToList();
        if (productIds.Count == 0) return new Dictionary<Guid, string?>();

        return await db.Products
            .AsNoTracking()
            .Where(p => productIds.Contains(p.Id))
            .Select(p => new { p.Id, ImageUrl = p.Images.Select(i => i.Url).FirstOrDefault() })
            .ToDictionaryAsync(p => p.Id, p => p.ImageUrl);
    }

    private static OrderDto ToDto(Order o, IReadOnlyDictionary<Guid, string?> images) => new(
        o.Id, o.OrderNumber, o.CustomerId, o.CustomerName, o.Phone, o.Email, o.DeliveryCity, o.DeliveryAddress,
        o.Subtotal, o.DeliveryFee, o.PointsDiscount, o.Total, o.PointsEarned, o.PointsSpent,
        o.PaymentMethod, o.Status, o.Note, o.IsManualEntry, o.CreatedAt, o.StatusUpdatedAt,
        o.Items.Select(i => new OrderItemDto(
            i.Id, i.ProductId, i.ProductNameSnapshot, images.GetValueOrDefault(i.ProductId), i.Quantity, i.SelectedSize,
            i.SelectedColors, i.CustomText, i.SelectedExtras, i.UnitPrice, i.LineTotal)).ToList());
}
