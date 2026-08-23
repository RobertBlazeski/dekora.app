using Dekora.Api.Constants;
using Dekora.Api.Data;
using Dekora.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dekora.Api.Controllers;

[ApiController]
[Route("api/contact-info")]
public class ContactInfoController(DekoraDbContext db) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ContactInfoDto>> Get()
    {
        var info = await db.ContactInfo.AsNoTracking().FirstOrDefaultAsync();
        info ??= new Entities.ContactInfo();
        return Ok(new ContactInfoDto(info.InstagramHandle, info.Email, info.Location, info.PhoneNumbers));
    }

    [HttpPut]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ContactInfoDto>> Update(UpdateContactInfoRequest request)
    {
        var info = await db.ContactInfo.FirstOrDefaultAsync();
        if (info is null)
        {
            info = new Entities.ContactInfo();
            db.ContactInfo.Add(info);
        }

        info.InstagramHandle = request.InstagramHandle;
        info.Email = request.Email;
        info.Location = request.Location;
        info.PhoneNumbers = request.PhoneNumbers.Where(p => !string.IsNullOrWhiteSpace(p)).ToList();

        await db.SaveChangesAsync();
        return Ok(new ContactInfoDto(info.InstagramHandle, info.Email, info.Location, info.PhoneNumbers));
    }
}
