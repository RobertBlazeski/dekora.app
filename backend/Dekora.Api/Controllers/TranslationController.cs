using System.Text.Json;
using Dekora.Api.Constants;
using Dekora.Api.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Dekora.Api.Controllers;

// A single "Translate" button used across the admin dashboard (product names/descriptions,
// extras, FAQ entries) — drafts an English or Albanian version of whatever Macedonian text the
// owner already typed, via MyMemory's free translation API, so the owner reviews and fixes it
// rather than typing every field three times. Deliberately not Google/Azure/DeepL: MyMemory
// needs no API key, no billing account, and no setup at all — called anonymously, good for
// roughly 5,000 words/day, comfortably enough for manual, one-click-at-a-time use like this.
// Translation quality is rougher than a paid provider's, which is an accepted tradeoff here.
// Never called automatically; only a manual click, and the result always lands back in an
// editable field, never saved directly.
[ApiController]
[Route("api/translate")]
[Authorize(Roles = Roles.Admin)]
public class TranslationController(HttpClient httpClient, ILogger<TranslationController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<TranslateResponseDto>> Translate(TranslateRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
            return Ok(new TranslateResponseDto(string.Empty));

        if (request.TargetLanguage is not ("en" or "sq"))
            return Problem("targetLanguage must be 'en' or 'sq'.", statusCode: 400);

        try
        {
            var url = $"https://api.mymemory.translated.net/get?q={Uri.EscapeDataString(request.Text)}&langpair=mk|{request.TargetLanguage}";
            var response = await httpClient.GetAsync(url, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            // Parsed loosely rather than into a strict typed model — MyMemory's own
            // "responseStatus" field is inconsistently a number or a numeric string depending on
            // the error case, so checking directly for a translatedText string is the more
            // reliable success signal.
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("responseData", out var data) &&
                data.TryGetProperty("translatedText", out var translatedEl) &&
                translatedEl.ValueKind == JsonValueKind.String)
            {
                var translated = System.Net.WebUtility.HtmlDecode(translatedEl.GetString());
                return Ok(new TranslateResponseDto(translated ?? string.Empty));
            }

            var details = doc.RootElement.TryGetProperty("responseDetails", out var detailsEl) ? detailsEl.ToString() : null;
            logger.LogError("MyMemory translation failed: {Body}", body);
            return Problem(string.IsNullOrWhiteSpace(details) ? "Translation failed." : details, statusCode: 502);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to reach the translation service");
            return Problem("Couldn't reach the translation service — try again in a moment.", statusCode: 502);
        }
    }
}
