namespace Dekora.Api.Services;

public class ImageStorageOptions
{
    public const string SectionName = "ImageStorage";

    // Longest edge an uploaded image is resized down to — keeps product photos fast to load
    // without the owner needing to resize anything themselves before uploading.
    public int MaxDimension { get; set; } = 1600;
    public int JpegQuality { get; set; } = 82;
    public long MaxUploadSizeBytes { get; set; } = 10 * 1024 * 1024;
}
