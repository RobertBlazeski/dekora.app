using Dekora.Api.Data;
using Dekora.Api.DTOs;
using Dekora.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Dekora.Api.Controllers;

// Telegram calls this whenever someone messages the bot (see Program.cs's startup call to
// Telegram's setWebhook) — lets the owner pull a quick sales snapshot straight from the chat
// instead of opening the dashboard. Deliberately only ever replies to the one chat ID saved in
// NotificationSettings; anyone else who finds and messages the bot is silently ignored, since
// this exposes real revenue and traffic figures.
[ApiController]
[Route("api/telegram/webhook")]
[AllowAnonymous]
public class TelegramWebhookController(
    DekoraDbContext db,
    ITelegramSender telegramSender,
    IOptions<TelegramOptions> telegramOptions,
    ILogger<TelegramWebhookController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Handle([FromBody] TelegramUpdate update, CancellationToken cancellationToken)
    {
        var botToken = telegramOptions.Value.BotToken;
        if (string.IsNullOrWhiteSpace(botToken)) return Ok();

        var expectedSecret = TelegramWebhookSecret.Compute(botToken);
        if (Request.Headers["X-Telegram-Bot-Api-Secret-Token"] != expectedSecret)
        {
            logger.LogWarning("Telegram webhook call rejected — missing or wrong secret token");
            return Unauthorized();
        }

        var text = update.Message?.Text?.Trim();
        var chatId = update.Message?.Chat.Id;
        if (string.IsNullOrEmpty(text) || chatId is null) return Ok();

        var settings = await db.NotificationSettings.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
        if (settings?.TelegramHandle?.Trim() != chatId.Value.ToString())
            return Ok(); // Not the owner's chat — ignore silently rather than replying with an error.

        var reply = await BuildReplyAsync(text, cancellationToken);
        if (reply is not null)
            await telegramSender.SendAsync(chatId.Value.ToString(), reply, cancellationToken);

        return Ok();
    }

    private async Task<string?> BuildReplyAsync(string text, CancellationToken cancellationToken)
    {
        // Strips a "@botname" suffix (Telegram appends this to commands in group chats — not
        // relevant here since it's a private 1:1 chat, but harmless to handle).
        var command = text.Split(' ')[0].Split('@')[0].ToLowerInvariant();

        if (command is "/start" or "/help")
        {
            return "Commands:\n/today — today's stats\n/week — this week's stats (since Monday)\n/month — this month's stats (since the 1st)";
        }

        (DateTimeOffset? since, string? label) = command switch
        {
            "/today" => ((DateTimeOffset?)new DateTimeOffset(DateTimeOffset.UtcNow.UtcDateTime.Date, TimeSpan.Zero), "today"),
            "/week" => ((DateTimeOffset?)StartOfWeekUtc(), "this week"),
            "/month" => ((DateTimeOffset?)StartOfMonthUtc(), "this month"),
            _ => (null, null),
        };
        if (since is null || label is null) return null; // Not a recognized command — stay silent.

        var sinceValue = since.Value;
        var orders = await db.Orders.AsNoTracking().Where(o => o.CreatedAt >= sinceValue).ToListAsync(cancellationToken);
        var orderCount = orders.Count;
        // Subtotal, not Total — same reasoning as the Analytics dashboard: the delivery fee
        // isn't the owner's money, so it shouldn't count as revenue here either.
        var revenue = orders.Sum(o => o.Subtotal);
        var loggedInOrders = orders.Count(o => o.CustomerId != null);

        var sinceDateOnly = DateOnly.FromDateTime(sinceValue.UtcDateTime);
        var visitors = await db.DailyMetrics.AsNoTracking()
            .Where(m => m.Date >= sinceDateOnly)
            .SumAsync(m => m.VisitorCount, cancellationToken);

        return $"""
            📊 Stats for {label}

            Orders: {orderCount} ({loggedInOrders} from logged-in customers)
            Revenue: {revenue} ден
            Site visitors: {visitors}
            """;
    }

    private static DateTimeOffset StartOfWeekUtc()
    {
        var today = DateTimeOffset.UtcNow.UtcDateTime.Date;
        var daysSinceMonday = ((int)today.DayOfWeek + 6) % 7; // DayOfWeek: Sunday = 0
        return new DateTimeOffset(today.AddDays(-daysSinceMonday), TimeSpan.Zero);
    }

    private static DateTimeOffset StartOfMonthUtc()
    {
        var today = DateTimeOffset.UtcNow.UtcDateTime.Date;
        return new DateTimeOffset(new DateTime(today.Year, today.Month, 1), TimeSpan.Zero);
    }
}
