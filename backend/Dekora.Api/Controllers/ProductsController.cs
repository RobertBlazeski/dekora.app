using Dekora.Api.Constants;
using Dekora.Api.Data;
using Dekora.Api.DTOs;
using Dekora.Api.Entities;
using Dekora.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dekora.Api.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController(DekoraDbContext db, IWebHostEnvironment env, ILogger<ProductsController> logger) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductListItemDto>>> GetAll(
        [FromQuery] string? search, [FromQuery] string? category, [FromQuery] string? tag)
    {
        var query = db.Products.AsNoTracking().Include(p => p.Sizes).Include(p => p.Images).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p =>
                p.Name.Contains(search) ||
                (p.NameEn != null && p.NameEn.Contains(search)) ||
                (p.NameSq != null && p.NameSq.Contains(search)) ||
                p.Description.Contains(search) ||
                p.Tags.Any(t => t.Contains(search)));

        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(p => p.Categories.Contains(category));

        if (!string.IsNullOrWhiteSpace(tag))
            query = query.Where(p => p.Tags.Contains(tag));

        var products = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return Ok(products.Select(ToListItemDto).ToList());
    }

    // Owner-curated picks (see Product.IsTrending) for the homepage and product-page rails.
    [HttpGet("trending")]
    public async Task<ActionResult<IReadOnlyList<ProductListItemDto>>> GetTrending([FromQuery] int take = 12)
    {
        var products = await db.Products
            .AsNoTracking()
            .Include(p => p.Sizes)
            .Include(p => p.Images)
            .Where(p => p.IsTrending)
            .OrderBy(p => p.TrendingOrder ?? int.MaxValue)
            .ThenByDescending(p => p.CreatedAt)
            .Take(take)
            .ToListAsync();

        return Ok(products.Select(ToListItemDto).ToList());
    }

    // "Customers are also ordering" — primarily matches on shared category/tags (ranked by how
    // much overlap), fills any remaining slots with other shop products, and — only when there's
    // no category/tag match at all — falls back to the owner-curated bestsellers instead.
    [HttpGet("{id:guid}/also-ordered")]
    public async Task<ActionResult<IReadOnlyList<ProductListItemDto>>> GetAlsoOrdered(Guid id, [FromQuery] int take = 8)
    {
        var product = await db.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return Ok(Array.Empty<ProductListItemDto>());

        // Category/tag overlap can't be translated to SQL against the converted array columns,
        // so pull all other products and rank in-memory — fine at this catalog's scale.
        var others = await db.Products.AsNoTracking()
            .Include(p => p.Sizes)
            .Include(p => p.Images)
            .Where(p => p.Id != id)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var matched = others
            .Select(p => (Product: p, Overlap: p.Categories.Count(c => product.Categories.Contains(c)) + p.Tags.Count(t => product.Tags.Contains(t))))
            .Where(x => x.Overlap > 0)
            .OrderByDescending(x => x.Overlap)
            .ThenByDescending(x => x.Product.CreatedAt)
            .Take(take)
            .Select(x => x.Product)
            .ToList();

        List<Product> filler;
        if (matched.Count == 0)
        {
            // No category/tag match anywhere in the catalog — show bestsellers instead.
            filler = others
                .Where(p => p.IsTrending)
                .OrderBy(p => p.TrendingOrder ?? int.MaxValue)
                .ThenByDescending(p => p.CreatedAt)
                .Take(take)
                .ToList();
        }
        else
        {
            var matchedIds = matched.Select(p => p.Id).ToHashSet();
            filler = others.Where(p => !matchedIds.Contains(p.Id)).Take(take - matched.Count).ToList();
        }

        var result = matched.Concat(filler).Select(ToListItemDto).ToList();
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductDetailDto>> GetById(Guid id)
    {
        var product = await db.Products
            .AsNoTracking()
            .Include(p => p.Images)
            .Include(p => p.Sizes)
            .Include(p => p.ColorGroups).ThenInclude(g => g.Colors)
            .Include(p => p.Extras)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product is null) return NotFound();

        return Ok(ToDetailDto(product));
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ProductDetailDto>> Create(UpsertProductRequest request)
    {
        if (request.Categories.Count == 0)
            return Problem("A product must have at least one category.", statusCode: 400);

        var product = new Product();
        Apply(product, request);
        db.Products.Add(product);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, ToDetailDto(product));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ProductDetailDto>> Update(Guid id, UpsertProductRequest request)
    {
        if (request.Categories.Count == 0)
            return Problem("A product must have at least one category.", statusCode: 400);

        var product = await db.Products
            .Include(p => p.Images)
            .Include(p => p.Sizes)
            .Include(p => p.ColorGroups).ThenInclude(g => g.Colors)
            .Include(p => p.Extras)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product is null) return NotFound();

        // Replace child collections wholesale — simplest correct approach for an admin form
        // that submits the full product state on every save.
        db.ProductImages.RemoveRange(product.Images);
        db.ProductSizes.RemoveRange(product.Sizes);
        db.ProductColorGroups.RemoveRange(product.ColorGroups);
        db.ProductExtras.RemoveRange(product.Extras);

        Apply(product, request);
        await db.SaveChangesAsync();

        return Ok(ToDetailDto(product));
    }

    // Hard delete — safe because orders never depend on a live product: OrderItem stores its
    // own name/price snapshot and has no foreign key to Product at all, Review cascade-deletes
    // with the product, and HomepageContent.FeaturedProduct just goes null if it pointed here.
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var product = await db.Products.Include(p => p.Images).FirstOrDefaultAsync(p => p.Id == id);
        if (product is null) return NotFound();

        var imageUrls = product.Images.Select(i => i.Url).ToList();

        db.Products.Remove(product);
        await db.SaveChangesAsync();

        // Best-effort: an orphaned file left behind on disk is a non-issue, so this never
        // fails the delete itself.
        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        foreach (var url in imageUrls)
        {
            try
            {
                var relativePath = url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
                var filePath = Path.Combine(webRoot, relativePath);
                if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to delete orphaned image file for deleted product {ProductId}", id);
            }
        }

        return NoContent();
    }

    [HttpPatch("{id:guid}/sold-out")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> SetSoldOut(Guid id, SetSoldOutRequest request)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();

        product.SoldOut = request.SoldOut;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/colors/{colorId:guid}/sold-out")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> SetColorSoldOut(Guid id, Guid colorId, SetSoldOutRequest request)
    {
        var color = await db.ProductColors
            .FirstOrDefaultAsync(c => c.Id == colorId && c.ProductColorGroup!.ProductId == id);
        if (color is null) return NotFound();

        color.SoldOut = request.SoldOut;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/trending")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> SetTrending(Guid id, SetTrendingRequest request)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();

        product.IsTrending = request.IsTrending;
        product.TrendingOrder = request.TrendingOrder;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:guid}/featured")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> SetFeatured(Guid id, SetFeaturedRequest request)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();

        product.IsFeatured = request.IsFeatured;
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static void Apply(Product product, UpsertProductRequest request)
    {
        product.Name = request.Name;
        product.NameEn = request.NameEn;
        product.NameSq = request.NameSq;
        product.Description = request.Description;
        product.DescriptionEn = request.DescriptionEn;
        product.DescriptionSq = request.DescriptionSq;
        product.BasePrice = request.BasePrice;
        product.DiscountedPrice = request.DiscountedPrice is > 0 && request.DiscountedPrice < request.BasePrice
            ? request.DiscountedPrice
            : null;
        product.Categories = request.Categories;
        product.Tags = request.Tags;
        // Only meaningful for categories this product is actually assigned to — silently drop
        // anything else so a category picked, showcased, then unpicked doesn't leave an orphaned
        // showcase flag behind.
        product.ShowcaseCategories = request.ShowcaseCategories.Where(c => request.Categories.Contains(c)).ToList();
        product.SoldOut = request.SoldOut;
        product.SizesEnabled = request.SizesEnabled;
        product.CustomSizeEnabled = request.CustomSizeEnabled;
        product.CustomSizeUnitPrice = request.CustomSizeUnitPrice;
        product.CustomSizeUnitLabel = request.CustomSizeUnitLabel;
        product.CustomSizeBaseFee = request.CustomSizeBaseFee;
        product.ExtrasEnabled = request.ExtrasEnabled;

        product.Images = request.Images.Select(i => new ProductImage { Url = i.Url, ColorTag = i.ColorTag }).ToList();
        product.Sizes = request.Sizes.Select(s => new ProductSize
        {
            Name = s.Name,
            Description = s.Description,
            Price = s.Price,
            DiscountedPrice = s.DiscountedPrice is > 0 && s.DiscountedPrice < s.Price
                ? s.DiscountedPrice
                : null,
        }).ToList();
        product.ColorGroups = request.ColorGroups.Select(g => new ProductColorGroup
        {
            Name = g.Name,
            SortOrder = g.SortOrder,
            Colors = g.Colors.Select(c => new ProductColor { Name = c.Name, HexValue = c.HexValue, SoldOut = c.SoldOut }).ToList(),
        }).ToList();
        product.Extras = request.Extras.Select(x => new ProductExtra { Name = x.Name, Price = x.Price }).ToList();
    }

    private static ProductListItemDto ToListItemDto(Product p)
    {
        var pricing = ProductPricing.Summarize(p);
        return new ProductListItemDto(
            p.Id, p.Name, p.NameEn, p.NameSq, p.BasePrice, pricing.LowestPrice, pricing.IsDiscounted, pricing.DiscountPercent,
            p.Categories, p.SoldOut, p.IsTrending, p.IsFeatured, p.Images.Select(i => i.Url).FirstOrDefault());
    }

    private static ProductDetailDto ToDetailDto(Product p) => new(
        p.Id, p.Name, p.NameEn, p.NameSq, p.Description, p.DescriptionEn, p.DescriptionSq, p.BasePrice, p.DiscountedPrice, p.Categories, p.Tags, p.ShowcaseCategories,
        p.SoldOut, p.IsTrending, p.IsFeatured,
        p.SizesEnabled, p.CustomSizeEnabled, p.CustomSizeUnitPrice, p.CustomSizeUnitLabel, p.CustomSizeBaseFee, p.ExtrasEnabled,
        p.Images.Select(i => new ProductImageDto(i.Id, i.Url, i.ColorTag)).ToList(),
        // Sorted by effective price ascending — the sizes are entered in whatever order the
        // owner typed them (e.g. S, M, L), but a collection navigation property has no
        // guaranteed order from the database, and "cheapest first" is what customers expect
        // regardless of entry order.
        p.Sizes
            .OrderBy(s => s.DiscountedPrice ?? s.Price)
            .Select(s => new ProductSizeDto(s.Id, s.Name, s.Description, s.Price, s.DiscountedPrice))
            .ToList(),
        p.ColorGroups
            .OrderBy(g => g.SortOrder)
            .Select(g => new ProductColorGroupDto(
                g.Id, g.Name, g.SortOrder,
                g.Colors.Select(c => new ProductColorDto(c.Id, c.Name, c.HexValue, c.SoldOut)).ToList()))
            .ToList(),
        p.Extras.Select(x => new ProductExtraDto(x.Id, x.Name, x.Price)).ToList());
}
