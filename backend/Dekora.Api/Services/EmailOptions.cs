namespace Dekora.Api.Services;

public class EmailOptions
{
    public const string SectionName = "Email";

    // False by default so a fresh deployment without SMTP credentials configured degrades to
    // logging instead of throwing — see SmtpEmailSender.
    public bool Enabled { get; set; }
    public string SmtpHost { get; set; } = string.Empty;
    public int SmtpPort { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = "no-reply@dekora.mk";
    public string FromName { get; set; } = "Dekora";
}
