using Microsoft.EntityFrameworkCore;
using ModelContextProtocol.Server;
using StockMovementTrackerSystem.Infrastructure.Persistence;
using StockMovementTrackerSystem.McpServer.Attributes;
using StockMovementTrackerSystem.McpServer.Model;
using System.ComponentModel;

namespace StockMovementTrackerSystem.McpServer.Tools.Analytics;

/// <summary>
/// Domain: Inventory Analytics & Overview
/// Handles summarizing inventory status, product counts, stock unit totals, and operational health.
/// </summary>
[McpServerToolType]
[McpCategory("Analytics", isMutation: false)]
public class InventoryAnalyticsTool
{
    private readonly StockMovementTrackerSystemDbContext _context;

    public InventoryAnalyticsTool(StockMovementTrackerSystemDbContext context)
    {
        _context = context;
    }

    [McpServerTool]
    [Description("Get an overall summary overview of the entire inventory")]
    public async Task<InventorySummaryResponse> GetInventorySummary()
    {
        var totalProducts = await _context.ProductStocks.CountAsync();
        var totalStockUnits = await _context.ProductStocks.SumAsync(p => p.CurrentStock ?? 0);
        var outOfStockCount = await _context.ProductStocks.CountAsync(p => (p.CurrentStock ?? 0) == 0);
        var lowStockCount = await _context.ProductStocks.CountAsync(p => (p.CurrentStock ?? 0) > 0 && (p.CurrentStock ?? 0) <= 10);
        var activeAlertsCount = await _context.StockAlerts.CountAsync(a => !a.IsResolved);
        var totalMovements = await _context.StockMovements.CountAsync();

        return new InventorySummaryResponse
        {
            TotalProducts = totalProducts,
            TotalStockUnits = totalStockUnits,
            OutOfStockCount = outOfStockCount,
            LowStockCount = lowStockCount,
            ActiveAlertsCount = activeAlertsCount,
            TotalMovements = totalMovements
        };
    }
}
