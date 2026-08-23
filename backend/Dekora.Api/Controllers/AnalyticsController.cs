using Dekora.Api.Constants;
using Dekora.Api.Data;
using Dekora.Api.DTOs;
using Dekora.Api.Entities;
using Dekora.Api.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dekora.Api.Controllers;

[ApiController]
[Route("api/analytics")]
public class AnalyticsController(DekoraDbContext db) : ControllerBase
{
    // Pinged once per visit by the customer-app shell (see app.ts) — deliberately the
    // simplest possible visit counter: one row per calendar day, incremented on every ping.
    // No cookies, no per-visitor identity, nothing that needs a consent decision beyond what
    // the site's existing consent banner already covers.
    [HttpPost("visit")]
    [AllowAnonymous]
    public async Task<IActionResult> RecordVisit()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var metric = await db.DailyMetrics.FirstOrDefaultAsync(m => m.Date == today);
        if (metric is null)
        {
            metric = new DailyMetric { Date = today };
            db.DailyMetrics.Add(metric);
        }

        metric.VisitorCount++;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("daily")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<IReadOnlyList<DailyMetricDto>>> GetDaily([FromQuery] string range = "7d")
    {
        var days = range == "30d" ? 30 : 7;
        var sinceDate = DateTimeOffset.UtcNow.UtcDateTime.Date.AddDays(-(days - 1));
        var since = new DateTimeOffset(sinceDate, TimeSpan.Zero);
        var sinceDateOnly = DateOnly.FromDateTime(sinceDate);

        var visitorCounts = await db.DailyMetrics
            .AsNoTracking()
            .Where(m => m.Date >= sinceDateOnly)
            .ToDictionaryAsync(m => m.Date, m => m.VisitorCount);

        var orders = await db.Orders.AsNoTracking().Where(o => o.CreatedAt >= since).ToListAsync();
        var ordersByDay = orders
            .GroupBy(o => DateOnly.FromDateTime(o.CreatedAt.UtcDateTime.Date))
            .ToDictionary(g => g.Key, g => (Count: g.Count(), LoggedIn: g.Select(o => o.CustomerId).Where(c => c != null).Distinct().Count()));

        var result = Enumerable.Range(0, days)
            .Select(i => DateOnly.FromDateTime(sinceDate.AddDays(i)))
            .Select(date =>
            {
                visitorCounts.TryGetValue(date, out var visitors);
                ordersByDay.TryGetValue(date, out var orderStats);
                return new DailyMetricDto(date, visitors, orderStats.Count, orderStats.LoggedIn);
            })
            .ToList();

        return Ok(result);
    }

    // Real order data, live-aggregated — always accurate regardless of range.
    [HttpGet("sales-per-day")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<IReadOnlyList<DailySalesDto>>> GetSalesPerDay([FromQuery] string range = "7d")
    {
        var days = range == "30d" ? 30 : 7;
        var sinceDate = DateTimeOffset.UtcNow.UtcDateTime.Date.AddDays(-(days - 1));
        var since = new DateTimeOffset(sinceDate, TimeSpan.Zero);

        var orders = await db.Orders.AsNoTracking().Where(o => o.CreatedAt >= since).ToListAsync();
        // Subtotal, not Total — the delivery fee isn't the owner's money (paid straight to the
        // courier, or waived for pickup), so summing Total here would report revenue that's
        // never actually collected.
        var grouped = orders
            .GroupBy(o => DateOnly.FromDateTime(o.CreatedAt.UtcDateTime.Date))
            .ToDictionary(g => g.Key, g => (Count: g.Count(), Revenue: g.Sum(o => o.Subtotal)));

        var result = Enumerable.Range(0, days)
            .Select(i => DateOnly.FromDateTime(sinceDate.AddDays(i)))
            .Select(date => grouped.TryGetValue(date, out var stats)
                ? new DailySalesDto(date, stats.Count, stats.Revenue)
                : new DailySalesDto(date, 0, 0))
            .ToList();

        return Ok(result);
    }

    // Revenue split by category, for the pie chart — a product can belong to more than one
    // category, so each order line is attributed to that product's first (primary) category,
    // the same convention the admin product list already uses for its category badge.
    [HttpGet("by-category")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<IReadOnlyList<CategorySalesDto>>> GetSalesByCategory([FromQuery] string range = "30d")
    {
        var days = range == "7d" ? 7 : 30;
        var since = new DateTimeOffset(DateTimeOffset.UtcNow.UtcDateTime.Date.AddDays(-(days - 1)), TimeSpan.Zero);

        var items = await db.OrderItems
            .AsNoTracking()
            .Where(i => i.Order!.CreatedAt >= since)
            .Select(i => new { i.ProductId, i.LineTotal })
            .ToListAsync();

        var productIds = items.Select(i => i.ProductId).Distinct().ToList();
        var products = await db.Products
            .AsNoTracking()
            .Where(p => productIds.Contains(p.Id))
            .Select(p => new { p.Id, p.Categories })
            .ToListAsync();
        var primaryCategoryByProduct = products.ToDictionary(
            p => p.Id,
            p => p.Categories.Count > 0 ? p.Categories[0].ToString() : "Uncategorized");

        var result = items
            .GroupBy(i => primaryCategoryByProduct.GetValueOrDefault(i.ProductId, "Uncategorized"))
            .Select(g => new CategorySalesDto(g.Key, g.Count(), g.Sum(x => x.LineTotal)))
            .OrderByDescending(c => c.Revenue)
            .ToList();

        return Ok(result);
    }

    // Best sellers by revenue in the range — the "what's actually working" view that a plain
    // trend chart can't show.
    [HttpGet("top-products")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<IReadOnlyList<TopProductDto>>> GetTopProducts(
        [FromQuery] string range = "30d", [FromQuery] int take = 5)
    {
        var days = range == "7d" ? 7 : 30;
        var since = new DateTimeOffset(DateTimeOffset.UtcNow.UtcDateTime.Date.AddDays(-(days - 1)), TimeSpan.Zero);

        // GroupBy-with-aggregate over the Order join doesn't translate to SQL here, so pull the
        // (small, range-bounded) raw rows and aggregate in memory — same pattern as the
        // category breakdown above.
        var items = await db.OrderItems
            .AsNoTracking()
            .Where(i => i.Order!.CreatedAt >= since)
            .Select(i => new { i.ProductId, i.ProductNameSnapshot, i.Quantity, i.LineTotal })
            .ToListAsync();

        var result = items
            .GroupBy(i => new { i.ProductId, i.ProductNameSnapshot })
            .Select(g => new TopProductDto(g.Key.ProductId, g.Key.ProductNameSnapshot, g.Sum(i => i.Quantity), g.Sum(i => i.LineTotal)))
            .OrderByDescending(p => p.Revenue)
            .Take(take)
            .ToList();

        return Ok(result);
    }

    [HttpGet("overview")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<AnalyticsOverviewDto>> GetOverview()
    {
        var totalOrders = await db.Orders.CountAsync();
        // Subtotal, not Total — see the same note in GetSalesPerDay above.
        var totalRevenue = await db.Orders.SumAsync(o => (decimal?)o.Subtotal) ?? 0;
        var totalCustomers = await db.Users.CountAsync();
        var pendingOrders = await db.Orders.CountAsync(o => o.Status == OrderStatus.PendingConfirmation);
        var averageOrderValue = totalOrders == 0 ? 0 : totalRevenue / totalOrders;

        var todayStart = new DateTimeOffset(DateTimeOffset.UtcNow.UtcDateTime.Date, TimeSpan.Zero);
        var salesToday = await db.Orders.Where(o => o.CreatedAt >= todayStart).SumAsync(o => (decimal?)o.Subtotal) ?? 0;

        return Ok(new AnalyticsOverviewDto(totalOrders, totalRevenue, totalCustomers, pendingOrders, averageOrderValue, salesToday));
    }
}
