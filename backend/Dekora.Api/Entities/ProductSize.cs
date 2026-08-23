namespace Dekora.Api.Entities;

public class ProductSize
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public string Name { get; set; } = string.Empty;
    // e.g. "12 roses, 30cm box" — shown alongside the name so customers know what they're picking.
    public string? Description { get; set; }

    // The absolute selling price for this size — NOT added on top of Product.BasePrice. Each
    // size is its own complete price (e.g. Small = 450, Medium = 600), not a delta, since a
    // delta model meant picking "Small" silently added its price to the base price instead of
    // replacing it — confusing for the owner entering prices and wrong for the customer paying.
    public decimal Price { get; set; }

    // Set to put just this size on sale — when set and lower than Price, the size is
    // "discounted" and this becomes its selling price. Null means no discount on this size.
    public decimal? DiscountedPrice { get; set; }
}
