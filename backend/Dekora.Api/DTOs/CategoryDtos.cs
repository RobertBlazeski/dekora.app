namespace Dekora.Api.DTOs;

public record CategoryDto(Guid Id, string Name, string? NameEn, string? NameSq, int SortOrder, bool IsProductType, string? SampleImageUrl);

public record CreateCategoryRequest(string Name, string? NameEn = null, string? NameSq = null, bool IsProductType = false);

public record UpdateCategoryRequest(string Name, string? NameEn, string? NameSq, bool IsProductType);

// Null clears whichever product currently showcases this category, if any.
public record SetCategoryShowcaseRequest(Guid? ProductId);
