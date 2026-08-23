namespace Dekora.Api.Services;

// Every real send site (order placed, password reset) fires these and deliberately ignores the
// result — a failed notification must never fail the business operation it's attached to (see
// SmtpEmailSender/TelegramSender). The result exists purely for the owner-facing "send test
// notification" diagnostic in NotificationSettingsController, which needs to tell the owner
// *why* nothing arrived rather than just leaving them guessing.
public readonly record struct NotificationSendResult(bool Success, string? Error)
{
    public static NotificationSendResult Ok() => new(true, null);
    public static NotificationSendResult Fail(string error) => new(false, error);
}
