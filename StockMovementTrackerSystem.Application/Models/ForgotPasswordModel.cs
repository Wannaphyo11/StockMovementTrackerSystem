using System.ComponentModel.DataAnnotations;

namespace StockMovementTrackerSystem.Application.Models;

public class ForgotPasswordModel
{
    [Required]
    [EmailAddress]
    public required string Email { get; set; }
}

