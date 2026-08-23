using System.Security.Cryptography;
using System.Text;

namespace Dekora.Api.Services;

// Telegram signs webhook calls back with whatever secret_token was registered via setWebhook
// (see Program.cs) in the X-Telegram-Bot-Api-Secret-Token header — deriving it from the bot
// token itself, rather than a separate configured value, means there's nothing extra for the
// owner to set up, while still being unguessable by anyone who doesn't already have that token.
public static class TelegramWebhookSecret
{
    public static string Compute(string botToken)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes($"dekora-telegram-webhook:{botToken}"));
        // Telegram requires secret_token to be 1-256 chars of A-Z, a-z, 0-9, _ or - only —
        // uppercase hex satisfies that.
        return Convert.ToHexString(hash);
    }
}
