using Dekora.Api.Entities;

namespace Dekora.Api.Services;

public readonly record struct PricingSummary(decimal LowestPrice, bool IsDiscounted, int? DiscountPercent);

// Shared by ProductsController (shop/trending listings) and HomepageContentController (the
// featured-product hero tag) so "lowest price" and "is this on sale" are computed exactly the
// same way everywhere they're shown.
public static class ProductPricing
{
    // Every priced "option" a product offers right now: either its fixed sizes, or (when sizes
    // aren't enabled) the base price treated as a single option. Custom-size products have no
    // fixed options and are priced by a formula, so they're excluded from discounting entirely.
    private static IReadOnlyList<(decimal Regular, decimal? Discounted)> PricedOptions(Product p)
    {
        if (p.SizesEnabled && p.Sizes.Count > 0)
            return p.Sizes.Select(s => (Regular: s.Price, Discounted: s.DiscountedPrice)).ToList();

        return [(Regular: p.BasePrice, Discounted: p.DiscountedPrice)];
    }

    public static PricingSummary Summarize(Product p)
    {
        var options = PricedOptions(p);
        var lowestPrice = options.Min(o => o.Discounted ?? o.Regular);
        var discountedOptions = options.Where(o => o.Discounted is not null && o.Discounted < o.Regular).ToList();
        var isDiscounted = discountedOptions.Count > 0;
        int? discountPercent = isDiscounted
            ? (int)Math.Round(discountedOptions.Max(o => 1 - o.Discounted!.Value / o.Regular) * 100)
            : null;

        return new PricingSummary(lowestPrice, isDiscounted, discountPercent);
    }
}
