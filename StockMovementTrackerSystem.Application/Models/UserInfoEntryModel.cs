using StockMovementTrackerSystem.Domain.Entities;

namespace StockMovementTrackerSystem.Application.Models;

public class UserInfoEntryModel : UserInformation
{
    public string UserName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string PhoneNumber { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string RoleName { get; set; } = null!;
}
