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

    // Splits the homepage into two separate browsing rails — "Shop by occasion" (Birthdays,
    // Weddings, ...) and "Shop by type" (Bouquets, Balloons, Boxes, ...) — rather than one long
    // ranked list where a product-type category always loses to whichever occasion happens to
    // sort first. Set once by the owner when they create the category.
    public bool IsProductType { get; set; }
}
