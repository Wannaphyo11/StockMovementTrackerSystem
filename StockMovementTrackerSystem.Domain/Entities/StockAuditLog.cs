using System;
using System.Collections.Generic;

namespace StockMovementTrackerSystem.Domain.Entities;

public partial class StockAuditLog
{
    public string AuditLogId { get; set; } = null!;

    public string ProductId { get; set; } = null!;

    public string? MovementType { get; set; }

    public int? QuantityChanged { get; set; }

    public int? OldStock { get; set; }

    public int? NewStock { get; set; }

    public string ActionByUserId { get; set; } = null!;

    public DateTime? LogTimestamp { get; set; }

    public virtual ProductStock Product { get; set; } = null!;
}
