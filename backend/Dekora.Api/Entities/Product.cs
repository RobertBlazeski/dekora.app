namespace Dekora.Api.Entities;

public class Product
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;

    // Sale price used when SizesEnabled is false (i.e. the product has a single price) — when
    // set and lower than BasePrice, the product is "discounted" and this is its selling price.
    // When SizesEnabled is true, discounting happens per-size instead (see ProductSize) so the
    // owner can put just one size on sale.
    public decimal? DiscountedPrice { get; set; }

    // Optional per-locale overrides — Name/Description are shown for "mk" (the site default)
    // and as the fallback for whichever of these the owner leaves blank, so translating a
    // product is opt-in per field rather than a requirement.
    public string? NameEn { get; set; }
    public string? NameSq { get; set; }

    public string Description { get; set; } = string.Empty;
    public string? DescriptionEn { get; set; }
    public string? DescriptionSq { get; set; }

    public decimal BasePrice { get; set; }

    // A product can belong to more than one category (e.g. both "Weddings" and "Just because")
    // — the owner picks one or more, there's no separate "primary" category. Stored as plain
    // names (not an enum) so the owner can add new categories from the product form instead of
    // being limited to a fixed list — see the Category entity for the canonical name list.
    public List<string> Categories { get; set; } = new();
    public List<string> Tags { get; set; } = new();

    // Subset of Categories the owner has explicitly picked this product's photo to represent on
    // the homepage "shop by occasion" tile — lets the owner control that image directly instead
    // of it being guessed automatically. A category with no product opted in for it falls back
    // to an automatic pick (see CategoriesController.GetAll).
    public List<string> ShowcaseCategories { get; set; } = new();

    // Whole-product sold-out toggle. Independent of per-color sold-out (see ProductColor.SoldOut).
    public bool SoldOut { get; set; }

    // Owner-curated (not algorithmic) — the admin dashboard picks which products show in the
    // "Trending now" rail on the homepage and product pages. TrendingOrder is optional manual
    // ordering among trending picks; null sorts after any explicitly ordered ones.
    public bool IsTrending { get; set; }
    public int? TrendingOrder { get; set; }

    // Separate from IsTrending — reserved for a future "Most ordered" home section; not
    // surfaced anywhere in the customer UI yet, just settable from the admin product form.
    public bool IsFeatured { get; set; }

    public bool SizesEnabled { get; set; }

    // Custom size uses a price calculator instead of a fixed size list: base unit price
    // times a quantity multiplier the customer picks (e.g. "60 ден per rose"), plus an
    // optional flat fee on top (e.g. "150 ден wrapping") added once regardless of quantity.
    public bool CustomSizeEnabled { get; set; }
    public decimal? CustomSizeUnitPrice { get; set; }
    public string? CustomSizeUnitLabel { get; set; }
    public decimal? CustomSizeBaseFee { get; set; }

    public bool ExtrasEnabled { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public List<ProductImage> Images { get; set; } = new();
    public List<ProductSize> Sizes { get; set; } = new();
    public List<ProductColorGroup> ColorGroups { get; set; } = new();
    public List<ProductExtra> Extras { get; set; } = new();
    public List<Review> Reviews { get; set; } = new();
}
