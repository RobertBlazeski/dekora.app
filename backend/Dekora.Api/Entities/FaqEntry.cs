namespace Dekora.Api.Entities;

// Owner-editable FAQ, replacing what used to be hardcoded translated copy. Question/Answer are
// the entry as the owner wrote it (shown for "mk" and as the fallback); the *En/*Sq fields are
// optional per-locale overrides, same pattern as Product.NameEn/NameSq — translating an entry
// is opt-in, not required for every one.
public class FaqEntry
{
    public Guid Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? QuestionEn { get; set; }
    public string? QuestionSq { get; set; }
    public string Answer { get; set; } = string.Empty;
    public string? AnswerEn { get; set; }
    public string? AnswerSq { get; set; }
    public int SortOrder { get; set; }
}
