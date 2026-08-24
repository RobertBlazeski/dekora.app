using System.Net.Http.Json;
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
// owner already typed, via Google's Cloud Translation API, so the owner reviews and fixes it
// rather than typing every field three times. Never called automatically; only ever a manual
// click, and the result always lands back in an editable field, never saved directly.
[ApiController]
[Route("api/translate")]
[Authorize(Roles = Roles.Admin)]
public class TranslationController(HttpClient httpClient, IOptions<GoogleTranslateOptions> options, ILogger<TranslationController> logger)
    : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [HttpPost]
    public async Task<ActionResult<TranslateResponseDto>> Translate(TranslateRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
            return Ok(new TranslateResponseDto(string.Empty));

        if (request.TargetLanguage is not ("en" or "sq"))
            return Problem("targetLanguage must be 'en' or 'sq'.", statusCode: 400);

        var apiKey = options.Value.GoogleApiKey;
        if (string.IsNullOrWhiteSpace(apiKey))
            return Problem("Translation isn't set up yet — no Google Translate API key is configured for this deployment.", statusCode: 400);

        try
        {
            var response = await httpClient.PostAsJsonAsync(
                $"https://translation.googleapis.com/language/translate/v2?key={apiKey}",
                new { q = request.Text, source = "mk", target = request.TargetLanguage, format = "text" },
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(cancellationToken);
                logger.LogError("Google Translate request failed ({Status}): {Body}", response.StatusCode, body);
                return Problem(DescribeGoogleError(body), statusCode: 502);
            }

            var payload = await response.Content.ReadFromJsonAsync<GoogleTranslateResponse>(JsonOptions, cancellationToken);
            var translated = payload?.Data?.Translations?.FirstOrDefault()?.TranslatedText;
            if (translated is null)
                return Problem("Google Translate returned an unexpected response.", statusCode: 502);

            return Ok(new TranslateResponseDto(System.Net.WebUtility.HtmlDecode(translated)));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to reach Google Translate");
            return Problem("Couldn't reach the translation service — try again in a moment.", statusCode: 502);
        }
    }

    // Google's own error message is specific enough to act on directly ("API key not valid",
    // "Cloud Translation API has not been used in project ... before or it is disabled", etc.).
    private static string DescribeGoogleError(string responseBody)
    {
        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            if (doc.RootElement.TryGetProperty("error", out var error) && error.TryGetProperty("message", out var message))
                return message.GetString() ?? "Translation failed.";
        }
        catch (JsonException)
        {
            // Fall through to the generic message below.
        }

        return "Translation failed.";
    }

    private record GoogleTranslateResponse(GoogleTranslateData? Data);
    private record GoogleTranslateData(List<GoogleTranslation>? Translations);
    private record GoogleTranslation(string? TranslatedText);
}
