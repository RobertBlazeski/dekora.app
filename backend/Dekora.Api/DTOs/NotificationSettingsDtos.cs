namespace Dekora.Api.DTOs;

public record NotificationSettingsDto(
    bool EmailEnabled,
    string? EmailAddress,
    bool WhatsAppEnabled,
    string? WhatsAppNumber,
    bool TelegramEnabled,
    string? TelegramHandle);

public record UpdateNotificationSettingsRequest(
    bool EmailEnabled,
    string? EmailAddress,
    bool WhatsAppEnabled,
    string? WhatsAppNumber,
    bool TelegramEnabled,
    string? TelegramHandle);
