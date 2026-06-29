using System;
using System.Collections.Generic;

namespace StockMovementTrackerSystem.Domain.Entities;

public partial class ViUserInformation
{
    public string UserId { get; set; } = null!;

    public string? UserName { get; set; }

    public string? FullName { get; set; }

    public string? PhoneNumber { get; set; }

    public string? Email { get; set; }

    public string? Address { get; set; }

    public bool? Status { get; set; }

    public string? RoleName { get; set; }

    public DateTime CreatedOn { get; set; }

    public string CreatedBy { get; set; } = null!;

    public DateTime? UpdatedOn { get; set; }

    public string? UpdatedBy { get; set; }

    public DateTime? TerminateDate { get; set; }
}
