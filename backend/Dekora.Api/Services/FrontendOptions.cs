namespace Dekora.Api.Services;

public class FrontendOptions
{
    public const string SectionName = "Frontend";

    // Used to build absolute links (password reset, etc.) that get sent by email — the API
    // has no other way to know its own customer-facing origin.
    public string BaseUrl { get; set; } = "http://localhost:4200";

    // The admin dashboard's own domain — used to build a direct "open admin login" link in
    // owner-facing notifications (order email/Telegram), since the API has no other way to know
    // that URL either.
    public string AdminBaseUrl { get; set; } = "http://localhost:4201";
}
