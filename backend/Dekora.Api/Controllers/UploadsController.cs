using Dekora.Api.Constants;
using Dekora.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using SkiaSharp;

namespace Dekora.Api.Controllers;

// Product photos, color-swatch photos, and the homepage banner image all go through here.
// Every upload is decoded, resized down to a sane max dimension, and re-encoded as a
// consistent-quality JPEG — the owner can upload a photo straight off their phone (often
// several MB, huge dimensions) and it still serves fast, without them needing to resize or
// compress anything themselves first. Files are stored on local disk under wwwroot/uploads
// (see docker-compose.yml for the persistent volume) and served back by UseStaticFiles — no
// external storage service needed for a catalog this size.
//
// Uses SkiaSharp (MIT-licensed, no revenue-based restrictions) rather than SixLabors.ImageSharp
// — ImageSharp 3+ requires either a paid commercial license or registering under its free-tier
// terms for commercial use, which isn't something to take on silently on someone else's behalf.
[ApiController]
[Route("api/uploads")]
[Authorize(Roles = Roles.Admin)]
public class UploadsController(IWebHostEnvironment env, IOptions<ImageStorageOptions> options, ILogger<UploadsController> logger)
    : ControllerBase
{
    private static readonly HashSet<string> AllowedContentTypes = ["image/jpeg", "image/png", "image/webp"];

    [HttpPost("image")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    public async Task<ActionResult<object>> UploadImage(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
            return Problem("No file was uploaded.", statusCode: 400);

        var config = options.Value;
        if (file.Length > config.MaxUploadSizeBytes)
            return Problem($"File is too large — max {config.MaxUploadSizeBytes / 1024 / 1024} MB.", statusCode: 400);

        if (!AllowedContentTypes.Contains(file.ContentType))
            return Problem("Only JPEG, PNG or WebP images are allowed.", statusCode: 400);

        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        var uploadsDir = Path.Combine(webRoot, "uploads");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid():N}.jpg";
        var filePath = Path.Combine(uploadsDir, fileName);

        try
        {
            await using var stream = file.OpenReadStream();
            using var original = SKBitmap.Decode(stream);
            if (original is null)
                return Problem("That file doesn't look like a valid image.", statusCode: 400);

            using var toEncode = ResizeIfNeeded(original, config.MaxDimension);
            using var image = SKImage.FromBitmap(toEncode);
            using var data = image.Encode(SKEncodedImageFormat.Jpeg, config.JpegQuality);

            await using var outputStream = System.IO.File.Create(filePath);
            data.SaveTo(outputStream);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to process uploaded image");
            return Problem("Something went wrong processing that image.", statusCode: 500);
        }

        return Ok(new { url = $"/uploads/{fileName}" });
    }

    // Returns a resized copy if either dimension exceeds maxDimension (preserving aspect
    // ratio), otherwise the original bitmap unchanged — never upscales.
    private static SKBitmap ResizeIfNeeded(SKBitmap original, int maxDimension)
    {
        if (original.Width <= maxDimension && original.Height <= maxDimension)
            return original;

        var scale = Math.Min((float)maxDimension / original.Width, (float)maxDimension / original.Height);
        var newWidth = Math.Max(1, (int)Math.Round(original.Width * scale));
        var newHeight = Math.Max(1, (int)Math.Round(original.Height * scale));

        var resized = original.Resize(new SKImageInfo(newWidth, newHeight), new SKSamplingOptions(SKFilterMode.Linear, SKMipmapMode.None));
        return resized ?? original;
    }
}
