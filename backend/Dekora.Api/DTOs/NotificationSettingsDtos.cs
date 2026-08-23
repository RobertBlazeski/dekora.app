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

// Null Success means that channel wasn't tested at all (disabled or missing its address/chat ID),
// distinct from Success: false, which means it was tried and failed — the UI needs to tell those
// two states apart rather than showing a blanket "nothing happened."
public record TestNotificationResultDto(
    bool? EmailSuccess,
    string? EmailError,
    bool? TelegramSuccess,
    string? TelegramError);
