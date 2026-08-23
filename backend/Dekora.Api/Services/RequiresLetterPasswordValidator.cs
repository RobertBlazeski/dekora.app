using System.Text.RegularExpressions;
using Dekora.Api.Entities;
using Microsoft.AspNetCore.Identity;

namespace Dekora.Api.Services;

// Identity's built-in RequireLowercase/RequireUppercase flags are case-specific, but the
// customer-facing rule (and the frontend's mirrored client-side validator) is meant to be
// simply "at least one letter, any case" — a password like "PASSWORD1" should be accepted, not
// rejected because it has no lowercase letter. This custom validator enforces exactly that,
// with both RequireLowercase and RequireUppercase left off in Program.cs.
public partial class RequiresLetterPasswordValidator : IPasswordValidator<ApplicationUser>
{
    public Task<IdentityResult> ValidateAsync(UserManager<ApplicationUser> manager, ApplicationUser user, string? password)
    {
        if (password is not null && LetterRegex().IsMatch(password))
            return Task.FromResult(IdentityResult.Success);

        return Task.FromResult(IdentityResult.Failed(new IdentityError
        {
            Code = "PasswordRequiresLetter",
            Description = "Passwords must have at least one letter.",
        }));
    }

    [GeneratedRegex("[a-zA-Z]")]
    private static partial Regex LetterRegex();
}
