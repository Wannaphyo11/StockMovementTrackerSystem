using System;
using System.Collections.Generic;

namespace StockMovementTrackerSystem.Domain.Entities;

public partial class StockMovement
{
    public string MovementId { get; set; } = null!;

    public string ProductId { get; set; } = null!;

    public int? Quantity { get; set; }

    public string? Type { get; set; }

    public DateTime? MovementDate { get; set; }

    public virtual ProductStock Product { get; set; } = null!;
}
