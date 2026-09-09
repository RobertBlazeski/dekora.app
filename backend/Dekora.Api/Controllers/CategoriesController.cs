using Dekora.Api.Constants;
using Dekora.Api.Data;
using Dekora.Api.DTOs;
using Dekora.Api.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dekora.Api.Controllers;

// The canonical category list — GET is public (shop page filter, product cards), creating and
// editing is admin-only. Deleting isn't exposed: a category that's already on products shouldn't
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
            // The homepage "shop by occasion/type" tile only shows a real product photo once the
            // owner has explicitly picked one for this category (see SetShowcase below) — no
            // guessing at "the best-looking product in it," which used to silently reassign a
            // tile's photo to whatever product was newest, surprising the owner every time they
            // added a product to a category without meaning to change its tile.
            var sample = await db.Products.AsNoTracking()
                .Include(p => p.Images)
                .Where(p => p.Categories.Contains(category.Name) && p.ShowcaseCategories.Contains(category.Name) && !p.SoldOut)
                .OrderByDescending(p => p.IsFeatured)
                .ThenByDescending(p => p.IsTrending)
                .FirstOrDefaultAsync();

            result.Add(ToDto(category, sample?.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault()));
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
            return Ok(ToDto(existing, null));

        var sortOrder = await db.Categories.CountAsync();
        var category = new Category
        {
            Name = name,
            NameEn = request.NameEn,
            NameSq = request.NameSq,
            SortOrder = sortOrder,
            IsProductType = request.IsProductType,
        };
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        // Brand new — no products in it yet, so there's nothing to show a sample photo of.
        return Ok(ToDto(category, null));
    }

    // Lets the owner add translations (or fix a typo, or move a category between "occasion" and
    // "type") after the fact — Create alone only covers what's set at the moment a category is
    // first added.
    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<CategoryDto>> Update(Guid id, UpdateCategoryRequest request)
    {
        var name = request.Name.Trim();
        if (name.Length == 0)
            return Problem("A category name is required.", statusCode: 400);

        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == id);
        if (category is null) return NotFound();

        category.Name = name;
        category.NameEn = request.NameEn;
        category.NameSq = request.NameSq;
        category.IsProductType = request.IsProductType;
        await db.SaveChangesAsync();

        return Ok(ToDto(category, null));
    }

    // Lets the owner pick a category's homepage tile photo directly (from the Homepage admin
    // page's category grid) instead of only being able to set it from deep inside a single
    // product's edit form. At most one product showcases a given category at a time, so whoever
    // currently holds it gets cleared first — otherwise GetAll's picker would have to guess again.
    [HttpPut("{id:guid}/showcase")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<CategoryDto>> SetShowcase(Guid id, SetCategoryShowcaseRequest request)
    {
        var category = await db.Categories.FirstOrDefaultAsync(c => c.Id == id);
        if (category is null) return NotFound();

        var currentHolders = await db.Products.Where(p => p.ShowcaseCategories.Contains(category.Name)).ToListAsync();
        foreach (var holder in currentHolders)
            holder.ShowcaseCategories = holder.ShowcaseCategories.Where(c => c != category.Name).ToList();

        string? sampleImageUrl = null;
        if (request.ProductId is { } productId)
        {
            var product = await db.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == productId);
            if (product is null) return Problem("Product not found.", statusCode: 400);
            if (!product.Categories.Contains(category.Name))
                return Problem("That product isn't assigned to this category.", statusCode: 400);

            product.ShowcaseCategories = [.. product.ShowcaseCategories, category.Name];
            sampleImageUrl = product.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault();
        }

        await db.SaveChangesAsync();
        return Ok(ToDto(category, sampleImageUrl));
    }

    private static CategoryDto ToDto(Category c, string? sampleImageUrl) =>
        new(c.Id, c.Name, c.NameEn, c.NameSq, c.SortOrder, c.IsProductType, sampleImageUrl);
}
