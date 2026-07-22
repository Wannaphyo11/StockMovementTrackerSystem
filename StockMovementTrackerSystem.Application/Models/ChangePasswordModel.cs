using System.ComponentModel.DataAnnotations;

namespace StockMovementTrackerSystem.Application.Models;

public class ChangePasswordModel
{
    [Required]
    public required string UserName { get; set; }

    [Required]
    public required string OldPassword { get; set; }

    [Required]
    public required string NewPassword { get; set; }

    [Required]
    public required string ConfirmPassword { get; set; }
}
