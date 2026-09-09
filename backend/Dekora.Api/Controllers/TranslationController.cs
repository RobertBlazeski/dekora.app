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
// owner already typed, via MyMemory's free translation API, so the owner reviews and fixes it
// rather than typing every field three times. Deliberately not Google/Azure/DeepL: MyMemory
// needs no API key, no billing account, and no setup at all. Translation quality is rougher
// than a paid provider's, which is an accepted tradeoff here. Never called automatically; only
// a manual click, and the result always lands back in an editable field, never saved directly.
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
        // paste of something huge can't burn through MyMemory's daily free quota in a single call.
        if (request.Text.Length > 2000)
            return Problem("That text is too long to translate in one go (2000 character limit).", statusCode: 400);

        try
        {
            // Called anonymously, MyMemory's free tier is capped at ~5,000 words/day shared
            // across whatever else is calling from this server's IP — real product-catalog
            // usage burns through that fast and then every single call fails for the rest of
            // the day. Passing a contact email (no verification needed, doesn't need to be a
            // real inbox) raises that to 50,000 words/day per MyMemory's documented behavior.
            var contactEmail = Uri.EscapeDataString(emailOptions.Value.FromAddress);
            var url = $"https://api.mymemory.translated.net/get?q={Uri.EscapeDataString(request.Text)}&langpair=mk|{request.TargetLanguage}&de={contactEmail}";
            var response = await httpClient.GetAsync(url, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                logger.LogError("MyMemory returned HTTP {Status}: {Body}", (int)response.StatusCode, body);
                return Problem($"Translation service returned HTTP {(int)response.StatusCode}.", statusCode: 502);
            }

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
                {
                    logger.LogError("MyMemory refused the request: {Warning}", rawText);
                    return Problem(rawText, statusCode: 502);
                }

                var translated = System.Net.WebUtility.HtmlDecode(rawText);
                return Ok(new TranslateResponseDto(translated));
            }

            var details = doc.RootElement.TryGetProperty("responseDetails", out var detailsEl) ? detailsEl.ToString() : null;
            logger.LogError("MyMemory response had no usable translation: {Body}", body);
            return Problem(
                string.IsNullOrWhiteSpace(details)
                    ? $"Translation service gave an unusable response (HTTP {(int)response.StatusCode})."
                    : details,
                statusCode: 502);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to reach the translation service");
            return Problem($"Couldn't reach the translation service: {ex.GetType().Name} — {ex.Message}", statusCode: 502);
        }
    }
}
