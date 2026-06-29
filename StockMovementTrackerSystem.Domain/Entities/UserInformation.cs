using System;
using System.Collections.Generic;

namespace StockMovementTrackerSystem.Domain.Entities;

public partial class UserInformation
{
    public string UserId { get; set; } = null!;

    public string? FullName { get; set; }

    public string? Address { get; set; }

    public bool? Status { get; set; }

    public DateTime? TerminateDate { get; set; }

    public DateTime? CreatedOn { get; set; }

    public string? CreatedBy { get; set; }

    public DateTime? UpdatedOn { get; set; }

    public string? UpdatedBy { get; set; }
}
