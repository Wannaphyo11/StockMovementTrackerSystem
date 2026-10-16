using System;

namespace StockMovementTrackerSystem.McpServer.Model;

public class ProductStockResponse
{
    public string ProductId { get; set; } = null!;
    public string ProductName { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public string Status { get; set; } = string.Empty;
    public int TotalTransactionsCount { get; set; }
    public DateTime? LastUpdatedDate { get; set; }
}

public class StockMovementResponse
{
    public string MovementId { get; set; } = null!;
    public string ProductId { get; set; } = null!;
    public string ProductName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime? MovementDate { get; set; }
}

public class StockAlertResponse
{
    public string AlertId { get; set; } = null!;
    public string ProductId { get; set; } = null!;
    public string ProductName { get; set; } = string.Empty;
    public string AlertMessage { get; set; } = string.Empty;
    public bool IsResolved { get; set; }
    public DateTime? CreatedDate { get; set; }
}

public class InventorySummaryResponse
{
    public int TotalProducts { get; set; }
    public int TotalStockUnits { get; set; }
    public int OutOfStockCount { get; set; }
    public int LowStockCount { get; set; }
    public int ActiveAlertsCount { get; set; }
    public int TotalMovements { get; set; }
}

public class StockMovementToolResponse
{
    public string MovementId { get; set; } = null!;
    public string ProductId { get; set; } = null!;
    public string ProductName { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int RemainingStock { get; set; }
    public string Message { get; set; } = string.Empty;
}
