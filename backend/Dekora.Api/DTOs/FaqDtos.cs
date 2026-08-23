namespace Dekora.Api.DTOs;

public record FaqEntryDto(
    Guid Id, string Question, string? QuestionEn, string? QuestionSq,
    string Answer, string? AnswerEn, string? AnswerSq, int SortOrder);

public record UpsertFaqEntryRequest(
    string Question, string? QuestionEn, string? QuestionSq,
    string Answer, string? AnswerEn, string? AnswerSq, int SortOrder);

public record ContactInfoDto(string InstagramHandle, string Email, string Location, IReadOnlyList<string> PhoneNumbers);

public record UpdateContactInfoRequest(string InstagramHandle, string Email, string Location, List<string> PhoneNumbers);
