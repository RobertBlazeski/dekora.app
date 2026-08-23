namespace Dekora.Api.Entities;

public class ProductColor
{
    public Guid Id { get; set; }
    public Guid ProductColorGroupId { get; set; }
    public ProductColorGroup? ProductColorGroup { get; set; }

    public string Name { get; set; } = string.Empty;
    public string HexValue { get; set; } = string.Empty;

    // Independent of Product.SoldOut — a product can be in stock overall while
    // one specific color is sold out.
    public bool SoldOut { get; set; }
}
