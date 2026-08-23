using Dekora.Api.Constants;
using Dekora.Api.Data;
using Dekora.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dekora.Api.Controllers;

[ApiController]
[Route("api/notification-settings")]
[Authorize(Roles = Roles.Admin)]
public class NotificationSettingsController(DekoraDbContext db) : ControllerBase
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

    private static NotificationSettingsDto ToDto(Entities.NotificationSettings s) => new(
        s.EmailEnabled, s.EmailAddress, s.WhatsAppEnabled, s.WhatsAppNumber, s.TelegramEnabled, s.TelegramHandle);
}
