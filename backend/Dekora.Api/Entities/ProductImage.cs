namespace Dekora.Api.Entities;

public class ProductImage
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public string Url { get; set; } = string.Empty;

    // Optional: which product color this photo depicts, so the gallery can show a matching
    // real photo per color when available, falling back to a generic image otherwise.
    public string? ColorTag { get; set; }
}
