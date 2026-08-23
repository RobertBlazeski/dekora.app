using Dekora.Api.Constants;
using Dekora.Api.Data;
using Dekora.Api.DTOs;
using Dekora.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dekora.Api.Controllers;

[ApiController]
[Route("api/notification-settings")]
[Authorize(Roles = Roles.Admin)]
public class NotificationSettingsController(DekoraDbContext db, IEmailSender emailSender, ITelegramSender telegramSender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<NotificationSettingsDto>> Get()
    {
        var settings = await db.NotificationSettings.AsNoTracking().FirstOrDefaultAsync();
        settings ??= new Entities.NotificationSettings();

        return Ok(ToDto(settings));
    }

    [HttpPut]
    public async Task<ActionResult<NotificationSettingsDto>> Update(UpdateNotificationSettingsRequest request)
    {
        var settings = await db.NotificationSettings.FirstOrDefaultAsync();
        if (settings is null)
        {
            settings = new Entities.NotificationSettings();
            db.NotificationSettings.Add(settings);
        }

        settings.EmailEnabled = request.EmailEnabled;
        settings.EmailAddress = request.EmailAddress;
        settings.WhatsAppEnabled = request.WhatsAppEnabled;
        settings.WhatsAppNumber = request.WhatsAppNumber;
        settings.TelegramEnabled = request.TelegramEnabled;
        settings.TelegramHandle = request.TelegramHandle;

        await db.SaveChangesAsync();
        return Ok(ToDto(settings));
    }

    // Sends a real test message through whichever saved-and-enabled channels have a
    // destination, so the owner can confirm their setup actually works without having to place
    // a throwaway order or dig through server logs.
    [HttpPost("test")]
    public async Task<ActionResult<TestNotificationResultDto>> SendTest(CancellationToken cancellationToken)
    {
        var settings = await db.NotificationSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        if (settings is null)
            return Problem("Save your notification settings first.", statusCode: 400);

        NotificationSendResult? emailResult = null;
        if (settings.EmailEnabled && !string.IsNullOrWhiteSpace(settings.EmailAddress))
        {
            emailResult = await emailSender.SendAsync(
                settings.EmailAddress,
                "Dekora test notification",
                "<p>This is a test notification from your Dekora admin dashboard. If you're reading this, email notifications are working.</p>",
                cancellationToken);
        }

        NotificationSendResult? telegramResult = null;
        if (settings.TelegramEnabled && !string.IsNullOrWhiteSpace(settings.TelegramHandle))
        {
            telegramResult = await telegramSender.SendAsync(
                settings.TelegramHandle,
                "✅ Test notification from your Dekora admin dashboard — Telegram notifications are working.",
                cancellationToken);
        }

        return Ok(new TestNotificationResultDto(
            emailResult?.Success, emailResult?.Error,
            telegramResult?.Success, telegramResult?.Error));
    }

    private static NotificationSettingsDto ToDto(Entities.NotificationSettings s) => new(
        s.EmailEnabled, s.EmailAddress, s.WhatsAppEnabled, s.WhatsAppNumber, s.TelegramEnabled, s.TelegramHandle);
}
