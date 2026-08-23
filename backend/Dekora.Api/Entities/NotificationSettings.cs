namespace Dekora.Api.Entities;

// Single-row settings table (owner-configured). No provider is wired up yet — see
// INotificationSender / NoOpNotificationSender — this only stores where notifications
// would be sent once a provider (SendGrid, WhatsApp Business API, Telegram Bot API) exists.
public class NotificationSettings
{
    public Guid Id { get; set; }

    public bool EmailEnabled { get; set; }
    public string? EmailAddress { get; set; }

    public bool WhatsAppEnabled { get; set; }
    public string? WhatsAppNumber { get; set; }

    public bool TelegramEnabled { get; set; }
    public string? TelegramHandle { get; set; }
}
