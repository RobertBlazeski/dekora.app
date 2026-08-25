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

    // The owner's chosen display order — index 0 is the product's main photo everywhere on the
    // storefront. Without this, a plain collection navigation has no guaranteed row order in
    // Postgres: it would often happen to come back in insertion order right after saving, then
    // silently drift to a different order later (e.g. after a VACUUM or query plan change),
    // which is exactly why the "reposition" UI looked like it worked and then randomly didn't.
    public int SortOrder { get; set; }
}
