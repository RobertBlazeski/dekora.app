namespace Dekora.Api.DTOs;

public record HomepageContentDto(
    string BannerTitle,
    string BannerSubtitle,
    string? BannerImageUrl,
    string? BannerCtaLabel,
    string? BannerCtaLink,
    bool PromoBannerEnabled,
    string? PromoBannerText,
    string? PromoBannerLink,
    DateTimeOffset? PromoBannerEndsAt,
    // Always populated when PromoBannerEnabled — either the owner's own end time, or the
    // current tick of the rolling 1-day default cycle. This is what the storefront counts down
    // to; PromoBannerEndsAt (above) is only the owner's raw, editable setting.
    DateTimeOffset EffectivePromoBannerEndsAt,
    FeaturedProductDto? FeaturedProduct);

public record UpdateHomepageContentRequest(
    string BannerTitle,
    string BannerSubtitle,
    string? BannerImageUrl,
    string? BannerCtaLabel,
    string? BannerCtaLink,
    bool PromoBannerEnabled,
    string? PromoBannerText,
    string? PromoBannerLink,
    DateTimeOffset? PromoBannerEndsAt,
    Guid? FeaturedProductId);

// A trimmed-down product summary just for the hero — the customer app needs the display name,
// image, and the same "lowest price" figure the shop listings use so the price tag is never
// computed twice in two different ways.
public record FeaturedProductDto(
    Guid Id, string Name, string? NameEn, string? NameSq, string? PrimaryImageUrl, decimal LowestPrice);
