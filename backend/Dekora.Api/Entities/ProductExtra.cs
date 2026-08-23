namespace Dekora.Api.Entities;

public class ProductExtra
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
}
