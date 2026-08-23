namespace Dekora.Api.Entities;

// The canonical list of category names the owner can assign to products — seeded with the
// original 5 built-in ones, extensible from the admin product form. Product.Categories stores
// plain name strings (not a foreign key) so a product keeps its category label even if the
// canonical entry is later renamed or removed, matching how Tags already work.
public class Category
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}
