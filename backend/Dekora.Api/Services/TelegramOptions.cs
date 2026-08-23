namespace Dekora.Api.Services;

public class TelegramOptions
{
    public const string SectionName = "Telegram";

    // The bot token from @BotFather. Which chat to message is per-owner and comes from
    // NotificationSettings.TelegramHandle (actually a numeric chat ID — see CompositeNotificationSender).
    public string BotToken { get; set; } = string.Empty;
}
