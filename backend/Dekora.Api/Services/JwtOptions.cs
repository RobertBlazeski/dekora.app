namespace Dekora.Api.Services;

// Bound from the "Jwt" appsettings section.
public class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    // A single owner logging into their own admin panel, not a multi-tenant SaaS session — the
    // previous 7-day expiry meant a couple of quiet weeks logged everything out silently (every
    // authenticated call started failing with 401, with nothing telling the owner why). 90 days
    // keeps normal usage from ever hitting this, while auth.interceptor.ts on the admin side now
    // also clears the session and bounces to /login if a token ever does expire mid-use.
    public int ExpiresMinutes { get; set; } = 60 * 24 * 90;
}
