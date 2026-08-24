namespace Dekora.Api.Entities;

public class ProductExtra
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public string Name { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string? NameSq { get; set; }
    public decimal Price { get; set; }

    // Opt-in per extra — when true, picking this extra (e.g. "Personalized name tag") reveals a
    // free-text box on the product page for what to actually put on it. Reuses the same snapshot
    // convention as SelectedColors ("{GroupName}: {ColorName}") rather than needing its own order
    // column: the entered text is folded into the SelectedExtras string as "{ExtraName}: {text}",
    // so every place that already displays SelectedExtras (admin order view, email, Telegram)
    // shows it automatically with no further plumbing.
    public bool CustomTextEnabled { get; set; }
}
