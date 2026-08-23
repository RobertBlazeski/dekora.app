namespace Dekora.Api.DTOs;

public record CreateReviewRequest(Guid ProductId, int Rating, string Text, string? ReviewerName);

public record ReviewDto(Guid Id, Guid ProductId, string ReviewerName, int Rating, string Text, DateTimeOffset CreatedAt);

public record ReviewAdminDto(
    Guid Id, Guid ProductId, string ProductName, string ReviewerName, int Rating, string Text, DateTimeOffset CreatedAt);

public record RatingBreakdownDto(int Rating, int Count);

public record ReviewStatsDto(int TotalReviews, double AverageRating, IReadOnlyList<RatingBreakdownDto> Breakdown);
