namespace Dekora.Api.DTOs;

public record RegisterRequest(string FullName, string Email, string Password, string? Phone);

public record LoginRequest(string Email, string Password);

public record AuthResponse(string Token, MeResponse User);

public record MeResponse(Guid Id, string FullName, string Email, string? Phone, int Points, IReadOnlyList<string> Roles);

public record ForgotPasswordRequest(string Email);

public record ResetPasswordRequest(string Email, string Token, string NewPassword);

public record CreateAdminRequest(string FullName, string Email, string Password);

public record AdminAccountDto(Guid Id, string FullName, string Email);
