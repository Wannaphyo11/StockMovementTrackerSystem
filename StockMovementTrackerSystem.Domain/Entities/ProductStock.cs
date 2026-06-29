using System;
using System.Collections.Generic;

namespace StockMovementTrackerSystem.Domain.Entities;

public partial class ProductStock
{
    public string ProductId { get; set; } = null!;

    public string? ProductName { get; set; }

    public int? CurrentStock { get; set; }

    public int? TotalTransactionsCount { get; set; }

    public DateTime? CreatedDate { get; set; }

    public DateTime? LastUpdatedDate { get; set; }

    public virtual ICollection<StockAlert> StockAlerts { get; set; } = new List<StockAlert>();

    public virtual ICollection<StockAuditLog> StockAuditLogs { get; set; } = new List<StockAuditLog>();

    public virtual ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
}
