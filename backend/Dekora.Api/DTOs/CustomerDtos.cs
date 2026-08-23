namespace Dekora.Api.DTOs;

public record CustomerListItemDto(
    Guid Id, string FullName, string Email, string? Phone, int Points, DateTimeOffset CreatedAt,
    int OrderCount, decimal TotalSpent);

public record CustomerDetailDto(
    Guid Id, string FullName, string Email, string? Phone, int Points, DateTimeOffset CreatedAt,
    int OrderCount, decimal TotalSpent);
