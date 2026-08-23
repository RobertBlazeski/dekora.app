using System.Web;
using Dekora.Api.Constants;
using Dekora.Api.DTOs;
using Dekora.Api.Entities;
using Dekora.Api.Extensions;
using Dekora.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace Dekora.Api.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    IJwtTokenService jwtTokenService,
    IEmailSender emailSender,
    IOptions<FrontendOptions> frontendOptions,
    ILogger<AuthController> logger) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        if (await userManager.FindByEmailAsync(request.Email) is not null)
            return Conflict(new { message = "An account with this email already exists." });

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            PhoneNumber = request.Phone
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return ValidationProblem(new ValidationProblemDetails(
                result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description })));

        await userManager.AddToRoleAsync(user, Roles.Customer);

        return await BuildAuthResponse(user);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
            return Unauthorized(new { message = "Invalid email or password." });

        return await BuildAuthResponse(user);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        // Always return 200 with the same body whether or not the account exists — a
        // different response for "no such account" would let an attacker enumerate registered
        // emails. The customer only ever sees "check your email if an account exists."
        if (user is not null)
        {
            var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
            // The customer-app router requires a locale prefix on every route ("mk"/"en"/"sq"),
            // but we don't know the recipient's language preference from an email address alone
            // — default to "mk" (the site's own default locale); the reset-password page itself
            // doesn't need translated UI to be usable if the customer switches language there.
            var link = $"{frontendOptions.Value.BaseUrl.TrimEnd('/')}/mk/reset-password" +
                $"?email={HttpUtility.UrlEncode(user.Email)}&token={HttpUtility.UrlEncode(resetToken)}";

            await emailSender.SendAsync(
                user.Email!,
                "Reset your Dekora password",
                $"""
                <p>Hi {System.Net.WebUtility.HtmlEncode(user.FullName)},</p>
                <p>Click the link below to choose a new password. This link expires soon and can only be used once.</p>
                <p><a href="{link}">{link}</a></p>
                <p>If you didn't request this, you can ignore this email — your password won't change.</p>
                """);
        }
        else
        {
            logger.LogInformation("Password reset requested for unknown email {Email}", request.Email);
        }

        return Ok(new { message = "If an account with that email exists, we've sent a reset link." });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return BadRequest(new { message = "This reset link is invalid or has expired." });

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            // Identity reports an expired/already-used/tampered token as a generic
            // "InvalidToken" error alongside any password-policy violations — surface both so
            // the customer knows whether to request a new link or just pick a different password.
            return ValidationProblem(new ValidationProblemDetails(
                result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description })));
        }

        return Ok(new { message = "Your password has been reset. You can now sign in." });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<MeResponse>> Me()
    {
        // Not userManager.GetUserAsync(User) — that resolves the user via ClaimTypes.NameIdentifier,
        // but the JWT only carries the "sub" claim (MapInboundClaims is off, see Program.cs) and
        // never gets mapped to NameIdentifier, so GetUserAsync would always return null here and
        // this endpoint would 401 for every legitimately logged-in customer. User.GetUserId() checks
        // "sub" first — the same helper every other authenticated endpoint in this API already uses.
        var userId = User.GetUserId();
        var user = userId is null ? null : await userManager.FindByIdAsync(userId.ToString()!);
        if (user is null) return Unauthorized();

        var roles = await userManager.GetRolesAsync(user);
        return Ok(new MeResponse(user.Id, user.FullName, user.Email!, user.PhoneNumber, user.Points, roles.ToList()));
    }

    // Lets an existing admin add another one — there's no other way to get the Admin role
    // (public registration always creates a Customer account) beyond editing the database
    // directly, which isn't something the owner should have to do to bring on a second person.
    [HttpGet("admins")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<IReadOnlyList<AdminAccountDto>>> GetAdmins()
    {
        var admins = await userManager.GetUsersInRoleAsync(Roles.Admin);
        return Ok(admins
            .OrderBy(u => u.FullName)
            .Select(u => new AdminAccountDto(u.Id, u.FullName, u.Email!))
            .ToList());
    }

    [HttpPost("create-admin")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<AdminAccountDto>> CreateAdmin(CreateAdminRequest request)
    {
        if (await userManager.FindByEmailAsync(request.Email) is not null)
            return Conflict(new { message = "An account with this email already exists." });

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return ValidationProblem(new ValidationProblemDetails(
                result.Errors.ToDictionary(e => e.Code, e => new[] { e.Description })));

        await userManager.AddToRoleAsync(user, Roles.Admin);

        return Ok(new AdminAccountDto(user.Id, user.FullName, user.Email!));
    }

    private async Task<AuthResponse> BuildAuthResponse(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        var token = jwtTokenService.CreateToken(user, roles);
        var me = new MeResponse(user.Id, user.FullName, user.Email!, user.PhoneNumber, user.Points, roles.ToList());
        return new AuthResponse(token, me);
    }
}
