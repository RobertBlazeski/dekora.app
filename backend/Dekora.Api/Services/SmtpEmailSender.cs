using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Dekora.Api.Services;

// Sends real email via SMTP once Email:Enabled + SMTP credentials are configured (appsettings /
// user-secrets / env vars — see EmailOptions). Until then it logs instead of throwing, so
// password-reset and order-notification flows keep working end-to-end in dev without any mail
// server configured — the reset link / notification just lands in the log instead of an inbox.
public class SmtpEmailSender(IOptions<EmailOptions> options, ILogger<SmtpEmailSender> logger) : IEmailSender
{
    public async Task SendAsync(string toAddress, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var config = options.Value;
        if (!config.Enabled || string.IsNullOrWhiteSpace(config.SmtpHost))
        {
            // Logging the full body (not just the subject) here is deliberate: without SMTP
            // configured, this log line is the only way to get a password-reset link during
            // local development, so it needs to actually contain the link.
            logger.LogInformation(
                "Email delivery not configured — would have sent {Subject} to {ToAddress}:\n{Body}",
                subject, toAddress, htmlBody);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(config.FromName, config.FromAddress));
        message.To.Add(MailboxAddress.Parse(toAddress));
        message.Subject = subject;
        message.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(config.SmtpHost, config.SmtpPort, SecureSocketOptions.StartTls, cancellationToken);
            if (!string.IsNullOrWhiteSpace(config.Username))
                await client.AuthenticateAsync(config.Username, config.Password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
        }
        catch (Exception ex)
        {
            // Email delivery failure must never fail the caller's business operation (order
            // placement, password reset request) — the order/token already succeeded, only the
            // notification about it failed.
            logger.LogError(ex, "Failed to send email {Subject} to {ToAddress}", subject, toAddress);
        }
    }
}
