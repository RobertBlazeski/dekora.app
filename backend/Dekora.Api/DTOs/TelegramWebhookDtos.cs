namespace Dekora.Api.DTOs;

// Only the handful of fields TelegramWebhookController actually reads — Telegram's real Update
// object has many more (edited_message, callback_query, etc.); anything else just leaves
// Message null, which the controller already treats as "nothing to do."
public record TelegramUpdate(TelegramMessage? Message);
public record TelegramMessage(TelegramChat Chat, string? Text);
public record TelegramChat(long Id);
