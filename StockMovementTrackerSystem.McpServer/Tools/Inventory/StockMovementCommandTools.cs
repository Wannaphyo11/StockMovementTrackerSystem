using ModelContextProtocol.Server;
using StockMovementTrackerSystem.McpServer.Model;
using StockMovementTrackerSystem.McpServer.Tools.Movements;
using System;
using System.ComponentModel;
using System.Threading.Tasks;

namespace StockMovementTrackerSystem.McpServer.Tools.Inventory;

/// <summary>
/// Legacy wrapper for StockMovementCommandTools.
/// Delegates all execution directly to StockMovementTool to maintain a single authoritative implementation
/// and avoid code duplication and logic divergence.
/// </summary>
[Obsolete("Use StockMovementTrackerSystem.McpServer.Tools.Movements.StockMovementTool instead.")]
public class StockMovementCommandTools
{
    private readonly StockMovementTool _stockMovementTool;

    public StockMovementCommandTools(StockMovementTool stockMovementTool)
    {
        _stockMovementTool = stockMovementTool;
    }

    // Record Stock Movement (Stock IN / OUT)
    [McpServerTool]
    [Description("Record a stock movement transaction (IN to increase stock, OUT to decrease/sell stock). Accepts product ID or product name.")]
    public Task<StockMovementToolResponse> CreateStockMovement(
        [Description("The product ID or product name (e.g. 'PRD-001' or 'Cake')")] string productId,
        [Description("Movement type ('IN' or 'OUT')")] string type,
        [Description("Quantity of items (must be greater than 0)")] int quantity)
    {
        return _stockMovementTool.CreateStockMovement(productId, type, quantity);
    }
}
