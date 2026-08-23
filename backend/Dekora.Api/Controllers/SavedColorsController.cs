using Dekora.Api.Constants;
using Dekora.Api.Data;
using Dekora.Api.DTOs;
using Dekora.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dekora.Api.Controllers;

// The owner's reusable color palette — save "Beige" once with its hex, and every later color
// group can pick up the exact same value by name instead of re-eyeballing it. Admin-only: this
// is a product-authoring tool, not customer-facing data.
[ApiController]
[Route("api/saved-colors")]
[Authorize(Roles = Roles.Admin)]
public class SavedColorsController(DekoraDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SavedColorDto>>> GetAll()
    {
        var colors = await db.SavedColors.AsNoTracking().OrderBy(c => c.Name).ToListAsync();
        return Ok(colors.Select(c => new SavedColorDto(c.Id, c.Name, c.HexValue)).ToList());
    }

    // Upsert by name (case-insensitive) — saving "Beige" again with a different hex just
    // updates the existing entry rather than creating a duplicate.
    [HttpPost]
    public async Task<ActionResult<SavedColorDto>> Save(UpsertSavedColorRequest request)
    {
        var name = request.Name.Trim();
        if (name.Length == 0)
            return Problem("A color name is required.", statusCode: 400);

        var existing = await db.SavedColors.FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());
        if (existing is not null)
        {
            existing.HexValue = request.HexValue;
            await db.SaveChangesAsync();
            return Ok(new SavedColorDto(existing.Id, existing.Name, existing.HexValue));
        }

        var color = new SavedColor { Name = name, HexValue = request.HexValue };
        db.SavedColors.Add(color);
        await db.SaveChangesAsync();
        return Ok(new SavedColorDto(color.Id, color.Name, color.HexValue));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var color = await db.SavedColors.FindAsync(id);
        if (color is null) return NotFound();

        db.SavedColors.Remove(color);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
