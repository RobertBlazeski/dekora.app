using Dekora.Api.Constants;
using Dekora.Api.Data;
using Dekora.Api.DTOs;
using Dekora.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dekora.Api.Controllers;

// The canonical category list — GET is public (shop page filter, product cards), creating new
// ones is admin-only. Deleting isn't exposed: a category that's already on products shouldn't
// silently vanish from them, and the owner can just stop using one going forward.
[ApiController]
[Route("api/categories")]
public class CategoriesController(DekoraDbContext db) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> GetAll()
    {
        var categories = await db.Categories.AsNoTracking().OrderBy(c => c.SortOrder).ToListAsync();

        var result = new List<CategoryDto>(categories.Count);
        foreach (var category in categories)
        {
            // A real product photo for the homepage "shop by occasion" tile — the owner's own
            // pick (Product.ShowcaseCategories) wins if one exists for this category, otherwise
            // falls back to whatever's currently the best-looking product in it, so the tile
            // still looks intentional even before the owner has picked anything. Ordering by
            // array-containment isn't reliably SQL-translatable, so the (small, per-category)
            // candidate set is sorted in-memory instead.
            var candidates = await db.Products.AsNoTracking()
                .Include(p => p.Images)
                .Where(p => p.Categories.Contains(category.Name) && !p.SoldOut)
                .ToListAsync();

            var sample = candidates
                .OrderByDescending(p => p.ShowcaseCategories.Contains(category.Name))
                .ThenByDescending(p => p.IsFeatured)
                .ThenByDescending(p => p.IsTrending)
                .ThenByDescending(p => p.CreatedAt)
                .FirstOrDefault();

            result.Add(new CategoryDto(category.Id, category.Name, category.SortOrder, sample?.Images.Select(i => i.Url).FirstOrDefault()));
        }

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<CategoryDto>> Create(CreateCategoryRequest request)
    {
        var name = request.Name.Trim();
        if (name.Length == 0)
            return Problem("A category name is required.", statusCode: 400);

        var existing = await db.Categories.FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower());
        if (existing is not null)
            return Ok(new CategoryDto(existing.Id, existing.Name, existing.SortOrder, null));

        var sortOrder = await db.Categories.CountAsync();
        var category = new Category { Name = name, SortOrder = sortOrder };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        // Brand new — no products in it yet, so there's nothing to show a sample photo of.
        return Ok(new CategoryDto(category.Id, category.Name, category.SortOrder, null));
    }
}
