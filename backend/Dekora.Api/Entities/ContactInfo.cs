namespace Dekora.Api.Entities;

// Single-row settings table (same pattern as NotificationSettings/HomepageContent) — the
// contact details shown on the FAQ page's "Get in touch" panel, owner-editable instead of
// hardcoded. Not per-locale: a handle/email/city name doesn't need translating.
public class ContactInfo
{
    public Guid Id { get; set; }
    public string InstagramHandle { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;

    // Owner can list more than one — e.g. a second staff member's number — same
    // primitive-collection pattern as Product.Tags.
    public List<string> PhoneNumbers { get; set; } = new();
}
