using System;
using System.Collections.Generic;

namespace StockMovementTrackerSystem.Domain.Entities;

public partial class ViProductStockSummary
{
    public string MovementId { get; set; } = null!;

    public string ProductId { get; set; } = null!;

    public string? ProductName { get; set; }

    public int? CurrentStock { get; set; }

    public int? Quantity { get; set; }

    public string? Type { get; set; }

    public int? TotalTransactionsCount { get; set; }

    public DateTime? MovementDate { get; set; }
}
