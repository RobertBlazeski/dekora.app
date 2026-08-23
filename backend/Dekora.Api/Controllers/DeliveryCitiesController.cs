using Dekora.Api.Constants;
using Dekora.Api.Data;
using Dekora.Api.DTOs;
using Dekora.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dekora.Api.Controllers;

// The owner-managed delivery city list — GET is public (checkout's city dropdown), creating new
// ones is admin-only (from the manual-order city picker). Same shape as CategoriesController.
[ApiController]
[Route("api/delivery-cities")]
public class DeliveryCitiesController(DekoraDbContext db) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<DeliveryCityDto>>> GetAll()
    {
        var cities = await db.DeliveryCities.AsNoTracking().OrderBy(c => c.SortOrder).ToListAsync();
        return Ok(cities.Select(c => new DeliveryCityDto(c.Id, c.Name, c.SortOrder)).ToList());
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<DeliveryCityDto>> Create(CreateDeliveryCityRequest request)
    {
        var name = request.Name.Trim();
        if (name.Length == 0)
            return Problem("A city name is required.", statusCode: 400);

        var existing = await db.DeliveryCities.FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());
        if (existing is not null)
            return Ok(new DeliveryCityDto(existing.Id, existing.Name, existing.SortOrder));

        var sortOrder = await db.DeliveryCities.CountAsync();
        var city = new DeliveryCity { Name = name, SortOrder = sortOrder };
        db.DeliveryCities.Add(city);
        await db.SaveChangesAsync();

        return Ok(new DeliveryCityDto(city.Id, city.Name, city.SortOrder));
    }
}
