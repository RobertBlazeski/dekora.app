using Dekora.Api.Constants;
using Dekora.Api.Data;
using Dekora.Api.DTOs;
using Dekora.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Dekora.Api.Controllers;

// Lets the owner change the homepage banner text/image (or feature a real product instead) from
// the admin dashboard without touching code — GET is public so the storefront can read it, PUT
// is admin-only.
[ApiController]
[Route("api/homepage-content")]
public class HomepageContentController(DekoraDbContext db) : ControllerBase
{
    private static readonly TimeSpan DefaultPromoCycleLength = TimeSpan.FromDays(1);

    [HttpGet]
    public async Task<ActionResult<HomepageContentDto>> Get()
    {
        var content = await db.HomepageContent
            .Include(c => c.FeaturedProduct).ThenInclude(p => p!.Sizes)
            .Include(c => c.FeaturedProduct).ThenInclude(p => p!.Images)
            .FirstOrDefaultAsync();

        var isNew = content is null;
        content ??= new Entities.HomepageContent();
        if (isNew) db.HomepageContent.Add(content);

        var effectiveEndsAt = ResolvePromoBannerCycle(content, DateTimeOffset.UtcNow, out var cycleChanged);
        if (isNew || cycleChanged) await db.SaveChangesAsync();

        return Ok(ToDto(content, effectiveEndsAt));
    }

    // Always keeps the promo banner counting down to something: the owner's own end time while
    // it's still in the future, otherwise the current tick of a rolling default cycle that
    // restarts itself from "now" the moment it lapses.
    private static DateTimeOffset ResolvePromoBannerCycle(Entities.HomepageContent content, DateTimeOffset now, out bool cycleChanged)
    {
        cycleChanged = false;
        if (content.PromoBannerEndsAt is { } customEnd && customEnd > now)
            return customEnd;

        if (content.PromoBannerCycleAnchor is null || now >= content.PromoBannerCycleAnchor.Value + DefaultPromoCycleLength)
        {
            content.PromoBannerCycleAnchor = now;
            cycleChanged = true;
        }

        return content.PromoBannerCycleAnchor!.Value + DefaultPromoCycleLength;
    }

    [HttpPut]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<HomepageContentDto>> Update(UpdateHomepageContentRequest request)
    {
        var content = await db.HomepageContent.FirstOrDefaultAsync();
        if (content is null)
        {
            content = new Entities.HomepageContent();
            db.HomepageContent.Add(content);
        }

        content.BannerTitle = request.BannerTitle;
        content.BannerSubtitle = request.BannerSubtitle;
        content.BannerImageUrl = request.BannerImageUrl;
        content.BannerCtaLabel = request.BannerCtaLabel;
        content.BannerCtaLink = request.BannerCtaLink;
        content.PromoBannerEnabled = request.PromoBannerEnabled;
        content.PromoBannerText = request.PromoBannerText;
        content.PromoBannerLink = request.PromoBannerLink;
        content.PromoBannerEndsAt = request.PromoBannerEndsAt;
        content.FeaturedProductId = request.FeaturedProductId;

        // A newly-set custom end time takes over the countdown immediately; clearing it (or
        // letting it lapse) hands back to the rolling default cycle, freshly restarted from now.
        var effectiveEndsAt = ResolvePromoBannerCycle(content, DateTimeOffset.UtcNow, out _);

        await db.SaveChangesAsync();

        // Reload with the featured product's pricing data included, now that the FK may have
        // changed — the tracked `content` doesn't have FeaturedProduct populated after a plain
        // FK assignment.
        var reloaded = await db.HomepageContent
            .AsNoTracking()
            .Include(c => c.FeaturedProduct).ThenInclude(p => p!.Sizes)
            .Include(c => c.FeaturedProduct).ThenInclude(p => p!.Images)
            .FirstAsync(c => c.Id == content.Id);

        return Ok(ToDto(reloaded, effectiveEndsAt));
    }

    private static HomepageContentDto ToDto(Entities.HomepageContent c, DateTimeOffset effectivePromoBannerEndsAt)
    {
        FeaturedProductDto? featured = null;
        if (c.FeaturedProduct is not null)
        {
            var pricing = ProductPricing.Summarize(c.FeaturedProduct);
            featured = new FeaturedProductDto(
                c.FeaturedProduct.Id, c.FeaturedProduct.Name, c.FeaturedProduct.NameEn, c.FeaturedProduct.NameSq,
                c.FeaturedProduct.Images.Select(i => i.Url).FirstOrDefault(), pricing.LowestPrice);
        }

        return new HomepageContentDto(
            c.BannerTitle, c.BannerSubtitle, c.BannerImageUrl, c.BannerCtaLabel, c.BannerCtaLink,
            c.PromoBannerEnabled, c.PromoBannerText, c.PromoBannerLink, c.PromoBannerEndsAt,
            effectivePromoBannerEndsAt, featured);
    }
}
