using System.ComponentModel;
using System.Text;
using Microsoft.EntityFrameworkCore;
using ModelContextProtocol.Server;
using StockMovementTrackerSystem.Domain.Entities;
using StockMovementTrackerSystem.Infrastructure.Persistence;

namespace StockMovementTrackerSystem.McpServer.Tools;

[McpServerToolType]
public class StockTool
{
    private readonly StockMovementTrackerSystemDbContext _context;

    public StockTool(StockMovementTrackerSystemDbContext context)
    {
        _context = context;
    }

    [McpServerTool(Name = "get_product_stock")]
    [Description("Find a product by its product ID or product name, and return its current stock quantity and status. Read-only operation.")]
    public async Task<string> GetProductStockAsync(
        [Description("The exact product ID or product name (e.g. 'PRD-001' or 'iPhone').")] string searchTerm,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(searchTerm))
        {
            return "Please provide a valid product ID or product name.";
        }

        var trimmed = searchTerm.Trim();

        // 1. Exact match first
        var exactProduct = await _context.ProductStocks
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ProductId == trimmed || p.ProductName == trimmed, cancellationToken);

        if (exactProduct != null)
        {
            return FormatProductInfo(exactProduct);
        }

        // 2. Fuzzy match (Contains)
        var matchedProducts = await _context.ProductStocks
            .AsNoTracking()
            .Where(p => p.ProductName != null && p.ProductName.Contains(trimmed))
            .Take(5)
            .ToListAsync(cancellationToken);

        if (matchedProducts.Count == 1)
        {
            return FormatProductInfo(matchedProducts[0]);
        }
        else if (matchedProducts.Count > 1)
        {
            var sb = new StringBuilder();
            sb.AppendLine($"Multiple products matched '{searchTerm}':");
            foreach (var p in matchedProducts)
            {
                sb.AppendLine($"- ID: {p.ProductId} | Name: {p.ProductName} | Current Stock: {p.CurrentStock ?? 0}");
            }
            sb.AppendLine("Please specify the exact Product ID or Name.");
            return sb.ToString();
        }

        return $"No product was found matching '{searchTerm}'.";
    }

    [McpServerTool(Name = "get_low_stock_products")]
    [Description("Get a list of products whose current stock is less than or equal to a specified threshold. Ideal for checking low stock alerts or re-ordering needs.")]
    public async Task<string> GetLowStockProductsAsync(
        [Description("Stock threshold count. Products with stock <= this number will be returned. Default is 10.")] int threshold = 10,
        [Description("Maximum number of products to return. Default is 10.")] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 50);

        var lowStockProducts = await _context.ProductStocks
            .AsNoTracking()
            .Where(p => (p.CurrentStock ?? 0) <= threshold)
            .OrderBy(p => p.CurrentStock ?? 0)
            .Take(safeLimit)
            .ToListAsync(cancellationToken);

        if (lowStockProducts.Count == 0)
        {
            return $"Good news! No products found with stock quantity <= {threshold}.";
        }

        var sb = new StringBuilder();
        sb.AppendLine($"Found {lowStockProducts.Count} product(s) with stock <= {threshold} (Showing up to {safeLimit}):");
        sb.AppendLine();
        foreach (var p in lowStockProducts)
        {
            var stockVal = p.CurrentStock ?? 0;
            var status = stockVal == 0 ? "[OUT OF STOCK]" : "[LOW STOCK]";
            sb.AppendLine($"- {status} ID: {p.ProductId} | Name: {p.ProductName ?? "N/A"} | Stock: {stockVal} | Transactions: {p.TotalTransactionsCount ?? 0}");
        }

        return sb.ToString();
    }

    [McpServerTool(Name = "get_stock_movement_history")]
    [Description("Get recent stock movements (IN/OUT transaction history). Can optionally filter by specific product ID or product name.")]
    public async Task<string> GetStockMovementHistoryAsync(
        [Description("Optional product ID or product name to filter movements. Leave empty to get movements for all products.")] string? searchTerm = null,
        [Description("Maximum number of movement records to return. Default is 10.")] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 50);

        var query = _context.StockMovements
            .AsNoTracking()
            .Include(m => m.Product)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var trimmed = searchTerm.Trim();
            query = query.Where(m => m.ProductId == trimmed || (m.Product != null && m.Product.ProductName != null && m.Product.ProductName.Contains(trimmed)));
        }

        var movements = await query
            .OrderByDescending(m => m.MovementDate)
            .Take(safeLimit)
            .ToListAsync(cancellationToken);

        if (movements.Count == 0)
        {
            return string.IsNullOrWhiteSpace(searchTerm)
                ? "No stock movement transactions found."
                : $"No stock movement transactions found for '{searchTerm}'.";
        }

        var sb = new StringBuilder();
        sb.AppendLine($"Recent Stock Movements (Total: {movements.Count}):");
        sb.AppendLine();
        foreach (var m in movements)
        {
            var dateStr = m.MovementDate?.ToString("yyyy-MM-dd HH:mm") ?? "N/A";
            var prodName = m.Product?.ProductName ?? m.ProductId;
            var type = (m.Type ?? "UNKNOWN").ToUpper();
            sb.AppendLine($"- [{dateStr}] Movement: {m.MovementId} | Product: {prodName} ({m.ProductId}) | Type: {type} | Quantity: {m.Quantity ?? 0}");
        }

        return sb.ToString();
    }

    [McpServerTool(Name = "get_active_stock_alerts")]
    [Description("Get active, unresolved stock alerts that need attention (e.g. out of stock or low inventory warnings).")]
    public async Task<string> GetActiveStockAlertsAsync(
        [Description("Maximum number of alerts to return. Default is 10.")] int limit = 10,
        CancellationToken cancellationToken = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 50);

        var alerts = await _context.StockAlerts
            .AsNoTracking()
            .Include(a => a.Product)
            .Where(a => !a.IsResolved)
            .OrderByDescending(a => a.CreatedDate)
            .Take(safeLimit)
            .ToListAsync(cancellationToken);

        if (alerts.Count == 0)
        {
            return "No active unresolved stock alerts at this time. All alerts are resolved!";
        }

        var sb = new StringBuilder();
        sb.AppendLine($"Active Unresolved Stock Alerts (Count: {alerts.Count}):");
        sb.AppendLine();
        foreach (var a in alerts)
        {
            var dateStr = a.CreatedDate?.ToString("yyyy-MM-dd HH:mm") ?? "N/A";
            var prodName = a.Product?.ProductName ?? a.ProductId;
            sb.AppendLine($"- [{dateStr}] Alert ID: {a.AlertId} | Product: {prodName} ({a.ProductId}) | Message: {a.AlertMessage ?? "N/A"}");
        }

        return sb.ToString();
    }

    [McpServerTool(Name = "get_inventory_summary")]
    [Description("Get an overall summary overview of the entire inventory, including total products, total stock quantity, out-of-stock items count, low-stock items count, and recent movements.")]
    public async Task<string> GetInventorySummaryAsync(CancellationToken cancellationToken = default)
    {
        var totalProducts = await _context.ProductStocks.CountAsync(cancellationToken);
        var totalStockUnits = await _context.ProductStocks.SumAsync(p => p.CurrentStock ?? 0, cancellationToken);
        var outOfStockCount = await _context.ProductStocks.CountAsync(p => (p.CurrentStock ?? 0) == 0, cancellationToken);
        var lowStockCount = await _context.ProductStocks.CountAsync(p => (p.CurrentStock ?? 0) > 0 && (p.CurrentStock ?? 0) <= 10, cancellationToken);
        var activeAlertsCount = await _context.StockAlerts.CountAsync(a => !a.IsResolved, cancellationToken);
        var totalMovements = await _context.StockMovements.CountAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("=== Inventory Overview Summary ===");
        sb.AppendLine($"- Total Distinct Products: {totalProducts}");
        sb.AppendLine($"- Total Stock Units in Warehouse: {totalStockUnits}");
        sb.AppendLine($"- Out of Stock Products (Stock = 0): {outOfStockCount}");
        sb.AppendLine($"- Low Stock Products (Stock 1 - 10): {lowStockCount}");
        sb.AppendLine($"- Active Unresolved Alerts: {activeAlertsCount}");
        sb.AppendLine($"- Total Stock Movement Records: {totalMovements}");

        return sb.ToString();
    }

    private static string FormatProductInfo(ProductStock product)
    {
        var stock = product.CurrentStock ?? 0;
        var status = stock == 0 ? "Out of Stock" : (stock <= 10 ? "Low Stock" : "In Stock");

        return
            $"Product ID: {product.ProductId}\n" +
            $"Product Name: {product.ProductName ?? "Unknown"}\n" +
            $"Current Stock: {stock}\n" +
            $"Stock Status: {status}\n" +
            $"Total Transactions: {product.TotalTransactionsCount?.ToString() ?? "0"}\n" +
            $"Last Updated: {product.LastUpdatedDate?.ToString("yyyy-MM-dd HH:mm:ss") ?? "N/A"}";
    }
}