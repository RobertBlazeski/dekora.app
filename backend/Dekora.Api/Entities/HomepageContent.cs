namespace Dekora.Api.Entities;

// Single-row settings table (owner-configured), same pattern as NotificationSettings — lets
// the owner change the homepage banner without touching code or redeploying.
public class HomepageContent
{
    public Guid Id { get; set; }

    public string BannerTitle { get; set; } = string.Empty;
    public string BannerSubtitle { get; set; } = string.Empty;
    public string? BannerImageUrl { get; set; }
    public string? BannerCtaLabel { get; set; }
    public string? BannerCtaLink { get; set; }

    // When set, the hero shows this product's photo instead of BannerImageUrl, with a "from
    // {lowest price}" tag that links to it — a real product tends to convert better than a
    // generic banner photo. BannerImageUrl stays as the fallback visual when this is null.
    public Guid? FeaturedProductId { get; set; }
    public Product? FeaturedProduct { get; set; }

    // A separate, optional announcement strip shown above the header (e.g. a time-limited
    // promotion) — independent of the hero banner below it, so the owner can run a promo
    // without touching the main banner copy/image.
    public bool PromoBannerEnabled { get; set; }
    public string? PromoBannerText { get; set; }
    public string? PromoBannerLink { get; set; }

    // Optional countdown the owner can set explicitly. The strip always shows a countdown
    // though — when this is null, or once it passes, the effective countdown falls back to a
    // rolling default cycle (see PromoBannerCycleAnchor) rather than disappearing, so there's
    // always a sense of urgency without the owner having to babysit it.
    public DateTimeOffset? PromoBannerEndsAt { get; set; }

    // Start of the current rolling "default" countdown cycle, used whenever there's no active
    // owner-set PromoBannerEndsAt. Each cycle lasts PromoBannerDefaultCycleLength; once it lapses
    // it's simply restarted from "now" the next time anyone reads the homepage content. Not
    // exposed to the API directly — only the computed effective end time is.
    public DateTimeOffset? PromoBannerCycleAnchor { get; set; }
}
