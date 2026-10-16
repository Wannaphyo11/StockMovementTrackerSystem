using Microsoft.EntityFrameworkCore;
using ModelContextProtocol.Server;
using StockMovementTrackerSystem.Infrastructure.Persistence;
using StockMovementTrackerSystem.McpServer.Attributes;
using StockMovementTrackerSystem.McpServer.Model;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;

namespace StockMovementTrackerSystem.McpServer.Tools.Inventory;

/// <summary>
/// Domain: Inventory & Product Catalog
/// Handles querying product inventory levels, finding products, and checking low stock items.
/// </summary>
[McpServerToolType]
[McpCategory("Inventory", isMutation: false)]
public class ProductStockTool
{
    private readonly StockMovementTrackerSystemDbContext _context;

    public ProductStockTool(StockMovementTrackerSystemDbContext context)
    {
        _context = context;
    }

    [McpServerTool]
    [Description("Find a product by its product ID or product name, and return its current stock quantity and status")]
    public async Task<List<ProductStockResponse>> GetProductStock(
        [Description("The product ID or product name (e.g. 'PRD-001' or 'iPhone')")] string? productId = null,
        [Description("Optional search term or product name")] string? searchTerm = null,
        [Description("Maximum number of products to return (default is 10, max is 100)")] int limit = 10)
    {
        // Enforce safe boundaries on limit parameter to avoid excessive database loads
        limit = Math.Clamp(limit, 1, 100);

        var term = (productId ?? searchTerm)?.Trim();
        if (string.IsNullOrWhiteSpace(term))
        {
            return [];
        }

        var lowerTerm = term.ToLower();

        var products = await _context.ProductStocks
            .AsNoTracking()
            .Where(p => p.ProductId.ToLower() == lowerTerm || 
                        (p.ProductName != null && p.ProductName.ToLower().Contains(lowerTerm)))
            .Take(limit)
            .Select(p => new ProductStockResponse
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName ?? "Unknown",
                CurrentStock = p.CurrentStock ?? 0,
                Status = (p.CurrentStock ?? 0) == 0 ? "Out of Stock" : ((p.CurrentStock ?? 0) <= 10 ? "Low Stock" : "In Stock"),
                TotalTransactionsCount = p.TotalTransactionsCount ?? 0,
                LastUpdatedDate = p.LastUpdatedDate
            })
            .ToListAsync();

        return products;
    }

    [McpServerTool]
    [Description("Get a list of products whose current stock is less than or equal to a specified threshold")]
    public async Task<List<ProductStockResponse>> GetLowStockProducts(
        [Description("Stock threshold count (default is 10, max is 10000)")] int threshold = 10,
        [Description("Maximum number of products to return (default is 10, max is 100)")] int limit = 10)
    {
        // Enforce safe parameter boundaries
        threshold = Math.Clamp(threshold, 0, 10000);
        limit = Math.Clamp(limit, 1, 100);

        var products = await _context.ProductStocks
            .AsNoTracking()
            .Where(p => (p.CurrentStock ?? 0) <= threshold)
            .OrderBy(p => p.CurrentStock ?? 0)
            .Take(limit)
            .Select(p => new ProductStockResponse
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName ?? "Unknown",
                CurrentStock = p.CurrentStock ?? 0,
                Status = (p.CurrentStock ?? 0) == 0 ? "Out of Stock" : "Low Stock",
                TotalTransactionsCount = p.TotalTransactionsCount ?? 0,
                LastUpdatedDate = p.LastUpdatedDate
            })
            .ToListAsync();

        return products;
    }
}
