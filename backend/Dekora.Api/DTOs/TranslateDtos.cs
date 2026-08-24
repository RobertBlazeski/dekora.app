namespace Dekora.Api.DTOs;

public record TranslateRequest(string Text, string TargetLanguage);
public record TranslateResponseDto(string TranslatedText);
