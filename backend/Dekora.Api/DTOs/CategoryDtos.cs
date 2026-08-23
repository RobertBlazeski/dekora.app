namespace Dekora.Api.DTOs;

public record CategoryDto(Guid Id, string Name, int SortOrder, string? SampleImageUrl);

public record CreateCategoryRequest(string Name);
