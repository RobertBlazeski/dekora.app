using System.Text.Json;
using Dekora.Api.Constants;
using Dekora.Api.DTOs;
using Dekora.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Dekora.Api.Controllers;

// A single "Translate" button used across the admin dashboard (product names/descriptions,
// extras, FAQ entries) — drafts an English or Albanian version of whatever Macedonian text the
// owner already typed, so the owner reviews and fixes it rather than typing every field three
// times. Deliberately not a paid provider (Google/Azure/DeepL): no API key, no billing account,
// no setup at all. Translation quality is rougher than a paid provider's, which is an accepted
// tradeoff here. Never called automatically; only a manual click, and the result always lands
// back in an editable field, never saved directly.
//
// Free/anonymous translation APIs are inherently flaky — rate limits, IP-based blocking, and
// plain outages all happen with no warning and no status page to check. Rather than depend on
// a single one, this tries MyMemory first and, if that fails for any reason, immediately falls
// back to Lingva (a free, keyless proxy in front of Google Translate) before giving up — so a
// bad day for one of them doesn't mean the button just stops working.
[ApiController]
[Route("api/translate")]
[Authorize(Roles = Roles.Admin)]
public class TranslationController(HttpClient httpClient, IOptions<EmailOptions> emailOptions, ILogger<TranslationController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<TranslateResponseDto>> Translate(TranslateRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
            return Ok(new TranslateResponseDto(string.Empty));

        if (request.TargetLanguage is not ("en" or "sq"))
            return Problem("targetLanguage must be 'en' or 'sq'.", statusCode: 400);

        // Every real use of this button is a product name, description, extra, or FAQ entry —
        // nothing here is ever remotely close to this. The cap exists purely so one accidental
        // paste of something huge can't burn through either provider's free quota in one call.
        if (request.Text.Length > 2000)
            return Problem("That text is too long to translate in one go (2000 character limit).", statusCode: 400);

        var (myMemoryOk, myMemoryText, myMemoryError) = await TryMyMemoryAsync(request.Text, request.TargetLanguage, cancellationToken);
        if (myMemoryOk)
            return Ok(new TranslateResponseDto(myMemoryText!));

        var (lingvaOk, lingvaText, lingvaError) = await TryLingvaAsync(request.Text, request.TargetLanguage, cancellationToken);
        if (lingvaOk)
            return Ok(new TranslateResponseDto(lingvaText!));

        logger.LogError("Both translation providers failed. MyMemory: {MyMemoryError}. Lingva: {LingvaError}", myMemoryError, lingvaError);
        return Problem($"Both translation providers failed. MyMemory: {myMemoryError} — Lingva: {lingvaError}", statusCode: 502);
    }

    private async Task<(bool Ok, string? Text, string? Error)> TryMyMemoryAsync(string text, string targetLanguage, CancellationToken cancellationToken)
    {
        try
        {
            // Called anonymously, MyMemory's free tier is capped at ~5,000 words/day shared
            // across whatever else is calling from this server's IP. Passing a contact email
            // (no verification needed, doesn't need to be a real inbox) raises that to 50,000
            // words/day per MyMemory's documented behavior.
            var contactEmail = Uri.EscapeDataString(emailOptions.Value.FromAddress);
            var url = $"https://api.mymemory.translated.net/get?q={Uri.EscapeDataString(text)}&langpair=mk|{targetLanguage}&de={contactEmail}";
            var response = await httpClient.GetAsync(url, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
                return (false, null, $"HTTP {(int)response.StatusCode}");

            // Parsed loosely rather than into a strict typed model — MyMemory's own
            // "responseStatus" field is inconsistently a number or a numeric string depending on
            // the error case, so checking directly for a translatedText string is the more
            // reliable success signal. Quota-exceeded and IP-blocked responses both still come
            // back as HTTP 200 with a warning placed directly in translatedText, so that string
            // is also screened for MyMemory's own "WARNING"/quota wording rather than trusted
            // as a real translation just because it's present.
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("responseData", out var data) &&
                data.TryGetProperty("translatedText", out var translatedEl) &&
                translatedEl.ValueKind == JsonValueKind.String)
            {
                var rawText = translatedEl.GetString() ?? string.Empty;
                if (rawText.Contains("MYMEMORY WARNING", StringComparison.OrdinalIgnoreCase) ||
                    rawText.Contains("QUOTA", StringComparison.OrdinalIgnoreCase))
                    return (false, null, rawText);

                return (true, System.Net.WebUtility.HtmlDecode(rawText), null);
            }

            var details = doc.RootElement.TryGetProperty("responseDetails", out var detailsEl) ? detailsEl.ToString() : null;
            return (false, null, string.IsNullOrWhiteSpace(details) ? $"unusable response (HTTP {(int)response.StatusCode})" : details);
        }
        catch (Exception ex)
        {
            return (false, null, $"{ex.GetType().Name} — {ex.Message}");
        }
    }

    private async Task<(bool Ok, string? Text, string? Error)> TryLingvaAsync(string text, string targetLanguage, CancellationToken cancellationToken)
    {
        try
        {
            var url = $"https://lingva.ml/api/v1/mk/{targetLanguage}/{Uri.EscapeDataString(text)}";
            var response = await httpClient.GetAsync(url, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
                return (false, null, $"HTTP {(int)response.StatusCode}");

            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("translation", out var translationEl) && translationEl.ValueKind == JsonValueKind.String)
                return (true, translationEl.GetString() ?? string.Empty, null);

            return (false, null, "unusable response");
        }
        catch (Exception ex)
        {
            return (false, null, $"{ex.GetType().Name} — {ex.Message}");
        }
    }
}
