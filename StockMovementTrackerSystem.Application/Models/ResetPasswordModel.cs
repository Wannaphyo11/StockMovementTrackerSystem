using System.ComponentModel.DataAnnotations;

namespace StockMovementTrackerSystem.Application.Models;

public class ResetPasswordModel
{
    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    public required string ResetToken { get; set; }

    [Required]
    public required string NewPassword { get; set; }

    [Required]
    public required string ConfirmPassword { get; set; }
}
