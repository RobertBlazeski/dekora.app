namespace Dekora.Api.Services;

public interface IEmailSender
{
    Task<NotificationSendResult> SendAsync(string toAddress, string subject, string htmlBody, CancellationToken cancellationToken = default);
}
