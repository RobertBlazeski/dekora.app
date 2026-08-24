namespace Dekora.Api.DTOs;

public record CategoryDto(Guid Id, string Name, int SortOrder, bool IsProductType, string? SampleImageUrl);

public record CreateCategoryRequest(string Name, bool IsProductType = false);
