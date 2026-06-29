using System;
using System.Collections.Generic;

namespace StockMovementTrackerSystem.Domain.Entities;

public partial class StockAlert
{
    public string AlertId { get; set; } = null!;

    public string ProductId { get; set; } = null!;

    public string? AlertMessage { get; set; }

    public bool IsResolved { get; set; }

    public DateTime? CreatedDate { get; set; }

    public virtual ProductStock Product { get; set; } = null!;
}
