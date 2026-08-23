namespace Dekora.Api.Services;

public class FrontendOptions
{
    public const string SectionName = "Frontend";

    // Used to build absolute links (password reset, etc.) that get sent by email — the API
    // has no other way to know its own customer-facing origin.
    public string BaseUrl { get; set; } = "http://localhost:4200";
}
