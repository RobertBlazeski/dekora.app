namespace Dekora.Api.Services;

public interface ITelegramSender
{
    Task<NotificationSendResult> SendAsync(string chatId, string text, CancellationToken cancellationToken = default);
}
