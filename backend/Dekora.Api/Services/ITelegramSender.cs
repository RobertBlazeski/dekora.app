namespace Dekora.Api.Services;

public interface ITelegramSender
{
    Task<NotificationSendResult> SendAsync(string chatId, string text, CancellationToken cancellationToken = default);

    // Sends one or more product photos as a follow-up to a text message — a single photo uses
    // Telegram's sendPhoto, two or more use sendMediaGroup (its album endpoint, capped at 10
    // photos per call). No-op (success) when photoUrls is empty, so callers don't need to guard.
    Task<NotificationSendResult> SendPhotosAsync(string chatId, IReadOnlyList<string> photoUrls, CancellationToken cancellationToken = default);
}
