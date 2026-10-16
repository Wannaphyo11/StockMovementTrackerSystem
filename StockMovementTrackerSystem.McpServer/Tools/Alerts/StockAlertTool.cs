using Microsoft.EntityFrameworkCore;
using ModelContextProtocol.Server;
using StockMovementTrackerSystem.Infrastructure.Persistence;
using StockMovementTrackerSystem.McpServer.Attributes;
using StockMovementTrackerSystem.McpServer.Model;
using System.ComponentModel;

namespace StockMovementTrackerSystem.McpServer.Tools.Alerts;

/// <summary>
/// Domain: Stock Alerts & Notifications
/// Handles monitoring and querying active system stock alerts.
/// </summary>
[McpServerToolType]
[McpCategory("Alerts", isMutation: false)]
public class StockAlertTool
{
    private readonly StockMovementTrackerSystemDbContext _context;

    public StockAlertTool(StockMovementTrackerSystemDbContext context)
    {
        _context = context;
    }

    [McpServerTool]
    [Description("Get active, unresolved stock alerts that need attention")]
    public async Task<List<StockAlertResponse>> GetActiveStockAlerts(
        [Description("Optional product ID to filter alerts")] string? productId = null,
        [Description("Maximum number of alerts to return (default is 10, max is 100)")] int limit = 10)
    {
        // Enforce safe parameter boundaries
        limit = Math.Clamp(limit, 1, 100);

        var query = _context.StockAlerts
            .AsNoTracking()
            .Include(a => a.Product)
            .Where(a => !a.IsResolved)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(productId))
        {
            var lowerId = productId.Trim().ToLower();
            query = query.Where(a => a.ProductId.ToLower() == lowerId);
        }

        var alerts = await query
            .OrderByDescending(a => a.CreatedDate)
            .Take(limit)
            .Select(a => new StockAlertResponse
            {
                AlertId = a.AlertId,
                ProductId = a.ProductId,
                ProductName = a.Product != null && a.Product.ProductName != null ? a.Product.ProductName : a.ProductId,
                AlertMessage = a.AlertMessage ?? string.Empty,
                IsResolved = a.IsResolved,
                CreatedDate = a.CreatedDate
            })
            .ToListAsync();

        return alerts;
    }
}
