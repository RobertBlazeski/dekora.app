using System.Net.Http.Json;
using Microsoft.Extensions.Options;

namespace Dekora.Api.Services;

// Telegram's Bot API is free and needs no business verification (unlike WhatsApp Business
// API), which makes it the most tractable "instant message" channel to wire up for real. The
// owner creates a bot via @BotFather, messages it once, then reads their numeric chat ID from
// https://api.telegram.org/bot<token>/getUpdates — that chat ID is what's stored in
// NotificationSettings.TelegramHandle (the field predates this and is named for a @handle, but
// a chat ID is what the send API actually needs).
public class TelegramSender(HttpClient httpClient, IOptions<TelegramOptions> options, ILogger<TelegramSender> logger) : ITelegramSender
{
    public async Task SendAsync(string chatId, string text, CancellationToken cancellationToken = default)
    {
        var botToken = options.Value.BotToken;
        if (string.IsNullOrWhiteSpace(botToken))
        {
            logger.LogInformation("Telegram bot token not configured — would have sent to {ChatId}: {Text}", chatId, text);
            return;
        }

        try
        {
            var response = await httpClient.PostAsJsonAsync(
                $"https://api.telegram.org/bot{botToken}/sendMessage",
                new { chat_id = chatId, text },
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                logger.LogError("Telegram send failed ({Status}) to {ChatId}: {Body}", response.StatusCode, chatId, body);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send Telegram message to {ChatId}", chatId);
        }
    }
}
