namespace Dekora.Api.Entities;

// Open review system, per the approved product-page spec — not gated on being logged in or on
// having a delivered order for this product. CustomerId is set opportunistically when the
// reviewer happens to be logged in (nice-to-have, e.g. for a future "verified" badge), but a
// review is valid on its own with just ReviewerName. The tradeoff (no purchase verification, so
// reviews can't be trusted as "verified buyer" reviews) is a deliberate choice from the spec —
// the admin Reviews page's delete action is the moderation tool for anything abusive.
public class Review
{
    public Guid Id { get; set; }

    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    public Guid? CustomerId { get; set; }
    public ApplicationUser? Customer { get; set; }

    // What's shown as the author — either what the reviewer typed, their account name if
    // logged in and left this blank, or "Anonymous".
    public string ReviewerName { get; set; } = "Anonymous";

    public int Rating { get; set; }
    public string Text { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
