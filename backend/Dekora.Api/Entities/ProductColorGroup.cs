namespace Dekora.Api.Entities;

// Replaces a fixed "Box color" / "Balloon color" split — the owner defines whatever named
// color groups make sense for a given product (e.g. "Box color", "Rose color", "Ribbon
// color"), and only the groups relevant to that product exist at all.
public class ProductColorGroup
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public List<ProductColor> Colors { get; set; } = new();
}
