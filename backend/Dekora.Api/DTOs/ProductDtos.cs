namespace Dekora.Api.DTOs;

public record ProductImageDto(Guid Id, string Url, string? ColorTag);
public record ProductSizeDto(Guid Id, string Name, string? Description, decimal Price, decimal? DiscountedPrice);
public record ProductColorDto(Guid Id, string Name, string HexValue, bool SoldOut);
public record ProductColorGroupDto(Guid Id, string Name, int SortOrder, IReadOnlyList<ProductColorDto> Colors);
public record ProductExtraDto(Guid Id, string Name, decimal Price);

public record ProductListItemDto(
    Guid Id,
    string Name,
    string? NameEn,
    string? NameSq,
    decimal BasePrice,
    // The lowest price a customer could actually pay for this product right now — across all
    // fixed sizes (or just BasePrice when there are none), using each option's discounted price
    // where one is set. What shop/trending listings show, so "from X ден" is never wrong.
    decimal LowestPrice,
    bool IsDiscounted,
    int? DiscountPercent,
    IReadOnlyList<string> Categories,
    bool SoldOut,
    bool IsTrending,
    bool IsFeatured,
    string? PrimaryImageUrl);

public record ProductDetailDto(
    Guid Id,
    string Name,
    string? NameEn,
    string? NameSq,
    string Description,
    string? DescriptionEn,
    string? DescriptionSq,
    decimal BasePrice,
    decimal? DiscountedPrice,
    IReadOnlyList<string> Categories,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> ShowcaseCategories,
    bool SoldOut,
    bool IsTrending,
    bool IsFeatured,
    bool SizesEnabled,
    bool CustomSizeEnabled,
    decimal? CustomSizeUnitPrice,
    string? CustomSizeUnitLabel,
    decimal? CustomSizeBaseFee,
    bool ExtrasEnabled,
    bool CustomTextEnabled,
    IReadOnlyList<ProductImageDto> Images,
    IReadOnlyList<ProductSizeDto> Sizes,
    IReadOnlyList<ProductColorGroupDto> ColorGroups,
    IReadOnlyList<ProductExtraDto> Extras);

public record UpsertProductSizeRequest(string Name, string? Description, decimal Price, decimal? DiscountedPrice);
public record UpsertProductColorRequest(string Name, string HexValue, bool SoldOut);
public record UpsertProductColorGroupRequest(string Name, int SortOrder, List<UpsertProductColorRequest> Colors);
public record UpsertProductExtraRequest(string Name, decimal Price);
public record UpsertProductImageRequest(string Url, string? ColorTag);

public record UpsertProductRequest(
    string Name,
    string? NameEn,
    string? NameSq,
    string Description,
    string? DescriptionEn,
    string? DescriptionSq,
    decimal BasePrice,
    decimal? DiscountedPrice,
    List<string> Categories,
    List<string> Tags,
    List<string> ShowcaseCategories,
    bool SoldOut,
    bool SizesEnabled,
    bool CustomSizeEnabled,
    decimal? CustomSizeUnitPrice,
    string? CustomSizeUnitLabel,
    decimal? CustomSizeBaseFee,
    bool ExtrasEnabled,
    bool CustomTextEnabled,
    List<UpsertProductImageRequest> Images,
    List<UpsertProductSizeRequest> Sizes,
    List<UpsertProductColorGroupRequest> ColorGroups,
    List<UpsertProductExtraRequest> Extras);

public record SetSoldOutRequest(bool SoldOut);
public record SetTrendingRequest(bool IsTrending, int? TrendingOrder);
public record SetFeaturedRequest(bool IsFeatured);
