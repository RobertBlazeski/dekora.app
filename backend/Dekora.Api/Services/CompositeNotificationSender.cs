using System.Text;
using Dekora.Api.Data;
using Dekora.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Dekora.Api.Services;

// Reads the owner's NotificationSettings row and fans the new-order event out to whichever
// channels are enabled. Email and Telegram are wired to real providers (SmtpEmailSender /
// TelegramSender); WhatsApp is intentionally not — the WhatsApp Business API requires a Meta
// Business/Twilio account with phone-number verification, which isn't something that can be
// wired up without the owner going through that signup themselves. The toggle and number stay
// in NotificationSettings for when that's set up, but the send is a no-op with a log line
// noting it wasn't delivered.
public class CompositeNotificationSender(
    DekoraDbContext db,
    IEmailSender emailSender,
    ITelegramSender telegramSender,
    IOptions<FrontendOptions> frontendOptions,
    ILogger<CompositeNotificationSender> logger) : INotificationSender
{
    public async Task NotifyNewOrderAsync(Order order, CancellationToken cancellationToken = default)
    {
        var settings = await db.NotificationSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings is null) return;

        var summary = BuildSummary(order);
        var imageUrls = await BuildImageUrlLookupAsync(order.Items, cancellationToken);

        if (settings.EmailEnabled && !string.IsNullOrWhiteSpace(settings.EmailAddress))
        {
            await emailSender.SendAsync(
                settings.EmailAddress,
                $"New order {order.OrderNumber} — {order.Total} ден",
                BuildHtmlSummary(order, imageUrls),
                cancellationToken);
        }

        if (settings.TelegramEnabled && !string.IsNullOrWhiteSpace(settings.TelegramHandle))
        {
            await telegramSender.SendAsync(settings.TelegramHandle, summary, cancellationToken);

            // A follow-up message, not folded into the text one — Telegram's photo endpoints are
            // separate calls from sendMessage, so this is the closest a bot can get to "one
            // notification with pictures attached."
            var distinctPhotos = order.Items
                .Select(i => imageUrls.GetValueOrDefault(i.ProductId))
                .Where(url => url is not null)
                .Distinct()
                .Take(10)
                .Cast<string>()
                .ToList();

            if (distinctPhotos.Count > 0)
                await telegramSender.SendPhotosAsync(settings.TelegramHandle, distinctPhotos, cancellationToken);
        }

        if (settings.WhatsAppEnabled && !string.IsNullOrWhiteSpace(settings.WhatsAppNumber))
        {
            logger.LogInformation(
                "WhatsApp notification for order {OrderNumber} would go to {Number}, but no WhatsApp provider is configured yet",
                order.OrderNumber, settings.WhatsAppNumber);
        }
    }

    // Product photos are stored as paths relative to the API's own origin ("/uploads/xxx.jpg" —
    // see UploadsController), which only resolves correctly inside a browser tab already on one
    // of this site's domains. An email client or Telegram's own servers fetching the image have
    // no such context, so these need to be turned into full URLs first — reusing the same public
    // customer-facing domain the review-nudge email's links already use (Caddy proxies
    // /uploads/* under it too, see Caddyfile).
    private async Task<IReadOnlyDictionary<Guid, string?>> BuildImageUrlLookupAsync(
        IEnumerable<OrderItem> items, CancellationToken cancellationToken)
    {
        var productIds = items.Select(i => i.ProductId).Distinct().ToList();
        if (productIds.Count == 0) return new Dictionary<Guid, string?>();

        var baseUrl = frontendOptions.Value.BaseUrl.TrimEnd('/');
        var relativeUrls = await db.Products
            .AsNoTracking()
            .Where(p => productIds.Contains(p.Id))
            .Select(p => new { p.Id, ImageUrl = p.Images.Select(i => i.Url).FirstOrDefault() })
            .ToDictionaryAsync(p => p.Id, p => p.ImageUrl, cancellationToken);

        return relativeUrls.ToDictionary(kv => kv.Key, kv => kv.Value is null ? null : $"{baseUrl}{kv.Value}");
    }

    private static string BuildSummary(Order order)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"New order {order.OrderNumber} — {order.Total} ден");
        sb.AppendLine($"{order.CustomerName} · {order.Phone}");
        sb.AppendLine($"Deliver to: {order.DeliveryAddress}");
        foreach (var item in order.Items)
            sb.AppendLine($"• {item.ProductNameSnapshot} × {item.Quantity}");
        if (!string.IsNullOrWhiteSpace(order.Note))
            sb.AppendLine($"Note: {order.Note}");
        return sb.ToString();
    }

    private static string BuildHtmlSummary(Order order, IReadOnlyDictionary<Guid, string?> imageUrls)
    {
        var items = string.Join("", order.Items.Select(i =>
        {
            var imageUrl = imageUrls.GetValueOrDefault(i.ProductId);
            var thumb = imageUrl is null
                ? ""
                : $"""<img src="{imageUrl}" alt="" width="48" height="48" style="width:48px;height:48px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:10px;">""";
            return $"""<li style="list-style:none;display:flex;align-items:center;margin-bottom:6px;">{thumb}{System.Net.WebUtility.HtmlEncode(i.ProductNameSnapshot)} × {i.Quantity} — {i.LineTotal} ден</li>""";
        }));
        var note = string.IsNullOrWhiteSpace(order.Note)
            ? ""
            : $"<p><strong>Note:</strong> {System.Net.WebUtility.HtmlEncode(order.Note)}</p>";

        return $"""
            <h2>New order {System.Net.WebUtility.HtmlEncode(order.OrderNumber)}</h2>
            <p><strong>{System.Net.WebUtility.HtmlEncode(order.CustomerName)}</strong> · {System.Net.WebUtility.HtmlEncode(order.Phone)} · {System.Net.WebUtility.HtmlEncode(order.Email)}</p>
            <p>Deliver to: {System.Net.WebUtility.HtmlEncode(order.DeliveryAddress)}</p>
            <p>Payment: {order.PaymentMethod}</p>
            <ul style="padding-left:0;margin:0;">{items}</ul>
            {note}
            <p><strong>Total: {order.Total} ден</strong></p>
            """;
    }
}
