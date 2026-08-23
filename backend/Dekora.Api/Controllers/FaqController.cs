using Dekora.Api.Constants;
using Dekora.Api.Data;
using Dekora.Api.DTOs;
using Dekora.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dekora.Api.Controllers;

// Owner-editable FAQ — GET is public (the customer FAQ page reads it), everything else is
// admin-only. Full CRUD rather than a single-row PUT (like HomepageContent) since this is a
// variable-length list the owner adds to and reorders over time.
[ApiController]
[Route("api/faq")]
public class FaqController(DekoraDbContext db) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<FaqEntryDto>>> GetAll()
    {
        var entries = await db.FaqEntries.AsNoTracking().OrderBy(e => e.SortOrder).ToListAsync();
        return Ok(entries.Select(ToDto).ToList());
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<FaqEntryDto>> Create(UpsertFaqEntryRequest request)
    {
        var entry = new FaqEntry();
        Apply(entry, request);
        db.FaqEntries.Add(entry);
        await db.SaveChangesAsync();
        return Ok(ToDto(entry));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<FaqEntryDto>> Update(Guid id, UpsertFaqEntryRequest request)
    {
        var entry = await db.FaqEntries.FindAsync(id);
        if (entry is null) return NotFound();

        Apply(entry, request);
        await db.SaveChangesAsync();
        return Ok(ToDto(entry));
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entry = await db.FaqEntries.FindAsync(id);
        if (entry is null) return NotFound();

        db.FaqEntries.Remove(entry);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static void Apply(FaqEntry entry, UpsertFaqEntryRequest request)
    {
        entry.Question = request.Question;
        entry.QuestionEn = request.QuestionEn;
        entry.QuestionSq = request.QuestionSq;
        entry.Answer = request.Answer;
        entry.AnswerEn = request.AnswerEn;
        entry.AnswerSq = request.AnswerSq;
        entry.SortOrder = request.SortOrder;
    }

    private static FaqEntryDto ToDto(FaqEntry e) => new(
        e.Id, e.Question, e.QuestionEn, e.QuestionSq, e.Answer, e.AnswerEn, e.AnswerSq, e.SortOrder);
}
