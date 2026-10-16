using ModelContextProtocol.Server;
using StockMovementTrackerSystem.McpServer.Model;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Threading.Tasks;

namespace StockMovementTrackerSystem.McpServer.Tools.Inventory;

/// <summary>
/// Legacy wrapper for ProductStockQueryTools.
/// Delegates all execution directly to ProductStockTool to maintain a single authoritative implementation
/// and avoid code duplication and logic divergence.
/// </summary>
[Obsolete("Use StockMovementTrackerSystem.McpServer.Tools.Inventory.ProductStockTool instead.")]
public class ProductStockQueryTools
{
    private readonly ProductStockTool _productStockTool;

    public ProductStockQueryTools(ProductStockTool productStockTool)
    {
        _productStockTool = productStockTool;
    }

    // 1. Get Product Stock by ID or Name
    [McpServerTool]
    [Description("Find a product by its product ID or product name, and return its current stock quantity and status")]
    public Task<List<ProductStockResponse>> GetProductStock(
        [Description("The product ID or product name (e.g. 'PRD-001' or 'iPhone')")] string? productId = null,
        [Description("Optional search term or product name")] string? searchTerm = null)
    {
        return _productStockTool.GetProductStock(productId, searchTerm);
    }

    // 2. Get Low Stock Products
    [McpServerTool]
    [Description("Get a list of products whose current stock is less than or equal to a specified threshold")]
    public Task<List<ProductStockResponse>> GetLowStockProducts(
        [Description("Stock threshold count (default is 10)")] int threshold = 10,
        [Description("Maximum number of products to return (default is 10)")] int limit = 10)
    {
        return _productStockTool.GetLowStockProducts(threshold, limit);
    }
}
