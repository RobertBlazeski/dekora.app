using Dekora.Api.Constants;
using Dekora.Api.Data;
using Dekora.Api.DTOs;
using Dekora.Api.Entities;
using Dekora.Api.Extensions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Dekora.Api.Controllers;

// Open review system per the approved product-page spec: anyone can rate and comment on a
// product, logged in or not, with no purchase verification — a deliberate trade-off in favor of
// a frictionless review flow. The admin Reviews page's delete action is the moderation backstop.
[ApiController]
public class ReviewsController(DekoraDbContext db) : ControllerBase
{
    [HttpPost("api/reviews")]
    [AllowAnonymous]
    [EnableRateLimiting("public-write")]
    public async Task<ActionResult<ReviewDto>> Create(CreateReviewRequest request)
    {
        if (request.Rating is < 1 or > 5)
            return Problem("Rating must be between 1 and 5.", statusCode: 400);

        if (!await db.Products.AnyAsync(p => p.Id == request.ProductId))
            return Problem("Product not found.", statusCode: 404);

        var customerId = User.GetUserId();
        string reviewerName;
        if (!string.IsNullOrWhiteSpace(request.ReviewerName))
        {
            reviewerName = request.ReviewerName.Trim();
        }
        else if (customerId is not null)
        {
            var customer = await db.Users.FindAsync(customerId.Value);
            reviewerName = customer?.FullName ?? "Anonymous";
        }
        else
        {
            reviewerName = "Anonymous";
        }

        var review = new Review
        {
            ProductId = request.ProductId,
            CustomerId = customerId,
            ReviewerName = reviewerName,
            Rating = request.Rating,
            Text = request.Text?.Trim() ?? string.Empty,
        };

        db.Reviews.Add(review);
        await db.SaveChangesAsync();

        return Ok(new ReviewDto(review.Id, review.ProductId, review.ReviewerName, review.Rating, review.Text, review.CreatedAt));
    }

    [HttpGet("api/products/{productId:guid}/reviews")]
    public async Task<ActionResult<IReadOnlyList<ReviewDto>>> GetForProduct(Guid productId)
    {
        var reviews = await db.Reviews
            .AsNoTracking()
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewDto(r.Id, r.ProductId, r.ReviewerName, r.Rating, r.Text, r.CreatedAt))
            .ToListAsync();

        return Ok(reviews);
    }

    // Admin moderation surface — every review across every product, newest first, for the
    // admin's Reviews page.
    [HttpGet("api/reviews")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<IReadOnlyList<ReviewAdminDto>>> GetAllForAdmin()
    {
        var reviews = await db.Reviews
            .AsNoTracking()
            .Include(r => r.Product)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReviewAdminDto(r.Id, r.ProductId, r.Product!.Name, r.ReviewerName, r.Rating, r.Text, r.CreatedAt))
            .ToListAsync();

        return Ok(reviews);
    }

    [HttpGet("api/reviews/stats")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ReviewStatsDto>> GetStats()
    {
        var reviews = await db.Reviews.AsNoTracking().Select(r => r.Rating).ToListAsync();
        var total = reviews.Count;
        var average = total == 0 ? 0 : reviews.Average();
        var breakdown = Enumerable.Range(1, 5)
            .Select(rating => new RatingBreakdownDto(rating, reviews.Count(r => r == rating)))
            .OrderByDescending(b => b.Rating)
            .ToList();

        return Ok(new ReviewStatsDto(total, Math.Round(average, 2), breakdown));
    }

    [HttpDelete("api/reviews/{id:guid}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var review = await db.Reviews.FindAsync(id);
        if (review is null) return NotFound();

        db.Reviews.Remove(review);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
