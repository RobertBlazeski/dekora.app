namespace Dekora.Api.Entities;

// The canonical list of category names the owner can assign to products — seeded with the
// original 5 built-in ones, extensible from the admin product form. Product.Categories stores
// plain name strings (not a foreign key) so a product keeps its category label even if the
// canonical entry is later renamed or removed, matching how Tags already work.
public class Category
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string? NameSq { get; set; }
    public int SortOrder { get; set; }

    // Splits the homepage (and the shop page's filter chips) into two separate groups — "Shop by
    // occasion" (Birthdays, Weddings, ...) and "Shop by type" (Bouquets, Balloons, Boxes, ...) —
    // rather than one long ranked list where a product-type category always loses to whichever
    // occasion happens to sort first. Editable any time via CategoriesController.Update.
    public bool IsProductType { get; set; }
}
