namespace Dekora.Api.DTOs;

public record SavedColorDto(Guid Id, string Name, string HexValue);

public record UpsertSavedColorRequest(string Name, string HexValue);
