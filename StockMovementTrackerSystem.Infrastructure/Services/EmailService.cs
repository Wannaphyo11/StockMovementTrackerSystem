using Microsoft.Extensions.Options;
using StockMovementTrackerSystem.Application.Interfaces;
using StockMovementTrackerSystem.Application.Models;
using System.Net;
using System.Net.Mail;

namespace StockMovementTrackerSystem.Infrastructure.Services;

public class EmailService(IOptions<EmailSettings> options) : IEmailService
{
    private readonly EmailSettings settings = options.Value;
    private string SenderEmail => string.IsNullOrWhiteSpace(settings.FromEmail)
        ? settings.UserName
        : settings.FromEmail;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(settings.Host) &&
        settings.Port is > 0 and <= 65535 &&
        !string.IsNullOrWhiteSpace(SenderEmail) &&
        (!settings.UseAuthentication ||
         (!string.IsNullOrWhiteSpace(settings.UserName) &&
          !string.IsNullOrWhiteSpace(settings.Password)));

    public async Task SendPasswordResetCodeAsync(
        string recipientEmail,
        string recipientName,
        string verificationCode,
        CancellationToken cancellationToken = default)
    {
        ValidateConfiguration();

        string safeName = WebUtility.HtmlEncode(recipientName);
        string safeCode = WebUtility.HtmlEncode(verificationCode);

        using MailMessage message = new()
        {
            From = new MailAddress(SenderEmail, settings.FromName),
            Subject = $"{verificationCode} is your password reset code",
            IsBodyHtml = true,
            Body = $$"""
                <!doctype html>
                <html>
                <body style="font-family:Arial,sans-serif;color:#1e293b;line-height:1.6">
                  <div style="max-width:560px;margin:0 auto;padding:24px">
                    <h2 style="margin-bottom:8px">Reset your password</h2>
                    <p>Hello {{safeName}},</p>
                    <p>Use this verification code to reset your Product Stock Tracker password:</p>
                    <div style="margin:28px 0;padding:18px;border-radius:10px;background:#eef2ff;color:#3730a3;font-size:30px;font-weight:700;letter-spacing:8px;text-align:center">{{safeCode}}</div>
                    <p>This code expires in 3 minutes and can only be used once.</p>
                    <p>If you did not request a password reset, you can safely ignore this email.</p>
                  </div>
                </body>
                </html>
                """
        };
        message.To.Add(new MailAddress(recipientEmail, recipientName));

        using SmtpClient client = new(settings.Host, settings.Port)
        {
            EnableSsl = settings.EnableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false
        };

        if (settings.UseAuthentication)
        {
            client.Credentials = new NetworkCredential(settings.UserName, settings.Password);
        }

        cancellationToken.ThrowIfCancellationRequested();
        await client.SendMailAsync(message, cancellationToken);
    }

    private void ValidateConfiguration()
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException(
                "EmailSettings host, sender, and SMTP credentials must be configured.");
        }
    }
}
