namespace Dekora.Api.Services;

public interface ITelegramSender
{
    Task SendAsync(string chatId, string text, CancellationToken cancellationToken = default);
}
