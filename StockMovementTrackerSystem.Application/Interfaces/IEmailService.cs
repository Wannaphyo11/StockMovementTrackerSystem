namespace StockMovementTrackerSystem.Application.Interfaces;

public interface IEmailService
{
    bool IsConfigured { get; }

    Task SendPasswordResetCodeAsync(
        string recipientEmail,
        string recipientName,
        string verificationCode,
        CancellationToken cancellationToken = default);
}
