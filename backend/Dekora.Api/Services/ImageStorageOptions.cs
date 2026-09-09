namespace Dekora.Api.Services;

public class ImageStorageOptions
{
    public const string SectionName = "ImageStorage";

    // Longest edge an uploaded image is resized down to — keeps product photos fast to load
    // without the owner needing to resize anything themselves before uploading.
    public int MaxDimension { get; set; } = 1600;
    public int JpegQuality { get; set; } = 82;
    public long MaxUploadSizeBytes { get; set; } = 10 * 1024 * 1024;

    // A "pixel flood" (the image-format equivalent of a zip bomb): a PNG/WebP file can be tiny
    // on disk — well under MaxUploadSizeBytes — while its header claims an enormous width/height,
    // decoding to gigabytes of raw pixel data and exhausting server memory the moment it's
    // decoded. This caps total decoded pixels well above anything a real camera/phone photo
    // would ever have (a 61MP request would still pass) while rejecting that class of attack
    // before any pixel buffer is allocated.
    public long MaxDecodedPixels { get; set; } = 60_000_000;
}
