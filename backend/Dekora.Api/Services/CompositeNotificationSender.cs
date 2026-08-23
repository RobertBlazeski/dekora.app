using System.Text;
using Dekora.Api.Data;
using Dekora.Api.Entities;
using Microsoft.EntityFrameworkCore;

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
    ILogger<CompositeNotificationSender> logger) : INotificationSender
{
    public async Task NotifyNewOrderAsync(Order order, CancellationToken cancellationToken = default)
    {
        var settings = await db.NotificationSettings.FirstOrDefaultAsync(cancellationToken);
        if (settings is null) return;

        var summary = BuildSummary(order);

        if (settings.EmailEnabled && !string.IsNullOrWhiteSpace(settings.EmailAddress))
        {
            await emailSender.SendAsync(
                settings.EmailAddress,
                $"New order {order.OrderNumber} — {order.Total} ден",
                BuildHtmlSummary(order),
                cancellationToken);
        }

        if (settings.TelegramEnabled && !string.IsNullOrWhiteSpace(settings.TelegramHandle))
        {
            await telegramSender.SendAsync(settings.TelegramHandle, summary, cancellationToken);
        }

        if (settings.WhatsAppEnabled && !string.IsNullOrWhiteSpace(settings.WhatsAppNumber))
        {
            logger.LogInformation(
                "WhatsApp notification for order {OrderNumber} would go to {Number}, but no WhatsApp provider is configured yet",
                order.OrderNumber, settings.WhatsAppNumber);
        }
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

    private static string BuildHtmlSummary(Order order)
    {
        var items = string.Join("", order.Items.Select(i => $"<li>{System.Net.WebUtility.HtmlEncode(i.ProductNameSnapshot)} × {i.Quantity} — {i.LineTotal} ден</li>"));
        var note = string.IsNullOrWhiteSpace(order.Note)
            ? ""
            : $"<p><strong>Note:</strong> {System.Net.WebUtility.HtmlEncode(order.Note)}</p>";

        return $"""
            <h2>New order {System.Net.WebUtility.HtmlEncode(order.OrderNumber)}</h2>
            <p><strong>{System.Net.WebUtility.HtmlEncode(order.CustomerName)}</strong> · {System.Net.WebUtility.HtmlEncode(order.Phone)} · {System.Net.WebUtility.HtmlEncode(order.Email)}</p>
            <p>Deliver to: {System.Net.WebUtility.HtmlEncode(order.DeliveryAddress)}</p>
            <p>Payment: {order.PaymentMethod}</p>
            <ul>{items}</ul>
            {note}
            <p><strong>Total: {order.Total} ден</strong></p>
            """;
    }
}
