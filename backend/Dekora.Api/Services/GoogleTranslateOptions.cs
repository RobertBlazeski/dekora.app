namespace Dekora.Api.Services;

public class GoogleTranslateOptions
{
    public const string SectionName = "Translation";

    // A plain Google Cloud API key with the Cloud Translation API enabled on its project — see
    // TranslationController. Left blank, the "Translate" buttons in the admin dashboard show a
    // clear "not configured" error instead of a mysterious failure.
    public string GoogleApiKey { get; set; } = string.Empty;
}
