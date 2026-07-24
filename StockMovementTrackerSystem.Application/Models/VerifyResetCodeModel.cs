using System.ComponentModel.DataAnnotations;

namespace StockMovementTrackerSystem.Application.Models;

public class VerifyResetCodeModel
{
    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "The verification code must contain 6 digits.")]
    public required string Code { get; set; }
}
