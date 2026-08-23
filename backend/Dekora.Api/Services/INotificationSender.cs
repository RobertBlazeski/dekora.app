using Dekora.Api.Entities;

namespace Dekora.Api.Services;

// Abstraction over "notify the owner a new order came in" so a real provider (SendGrid for
// email, Twilio/WhatsApp Business API, Telegram Bot API) can be slotted in later per
// NotificationSettings without touching order-creation code. See handoff spec §6.
public interface INotificationSender
{
    Task NotifyNewOrderAsync(Order order, CancellationToken cancellationToken = default);
}
