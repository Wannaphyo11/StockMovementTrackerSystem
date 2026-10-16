using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using ModelContextProtocol.Server;
using StockMovementTrackerSystem.Domain.Entities;
using StockMovementTrackerSystem.Infrastructure.Persistence;
using StockMovementTrackerSystem.McpServer.Attributes;
using StockMovementTrackerSystem.McpServer.Model;
using System.ComponentModel;
using System.Security.Claims;

namespace StockMovementTrackerSystem.McpServer.Tools.Movements;

/// <summary>
/// Domain: Stock Movements & Transactions
/// Handles tracking IN/OUT transaction records and recording new stock movement transactions.
/// </summary>
[McpServerToolType]
[McpCategory("Movements")]
public class StockMovementTool
{
    private readonly StockMovementTrackerSystemDbContext _context;
    private readonly IHttpContextAccessor? _httpContextAccessor;

    public StockMovementTool(
        StockMovementTrackerSystemDbContext context,
        IHttpContextAccessor? httpContextAccessor = null)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    [McpServerTool]
    [McpCategory("Movements", isMutation: false)]
    [Description("Get recent stock movements (IN/OUT transaction history). Can optionally filter by product ID or product name")]
    public async Task<List<StockMovementResponse>> GetStockMovementHistory(
        [Description("The product ID to filter transactions for (e.g. 'PRD-001')")] string? productId = null,
        [Description("Optional search term or product name")] string? searchTerm = null,
        [Description("Maximum number of records to return (default is 10, max is 100)")] int limit = 10)
    {
        // Enforce safe boundaries on limit parameter to avoid excessive database loads
        limit = Math.Clamp(limit, 1, 100);

        var term = (productId ?? searchTerm)?.Trim();

        var query = _context.StockMovements
            .AsNoTracking()
            .Include(m => m.Product)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(term))
        {
            var lowerTerm = term.ToLower();
            query = query.Where(m => m.ProductId.ToLower() == lowerTerm || 
                                     (m.Product != null && m.Product.ProductName != null && m.Product.ProductName.ToLower().Contains(lowerTerm)));
        }

        var movements = await query
            .OrderByDescending(m => m.MovementDate)
            .Take(limit)
            .Select(m => new StockMovementResponse
            {
                MovementId = m.MovementId,
                ProductId = m.ProductId,
                ProductName = m.Product != null && m.Product.ProductName != null ? m.Product.ProductName : m.ProductId,
                Type = m.Type ?? "UNKNOWN",
                Quantity = m.Quantity ?? 0,
                MovementDate = m.MovementDate
            })
            .ToListAsync();

        return movements;
    }

    [McpServerTool]
    [McpCategory("Movements", isMutation: true)]
    [Description("Record a stock movement transaction (IN to increase stock, OUT to decrease/sell stock). Accepts product ID or product name.")]
    public async Task<StockMovementToolResponse> CreateStockMovement(
        [Description("The product ID or product name (e.g. 'PRD-001' or 'Cake')")] string productId,
        [Description("Movement type ('IN' or 'OUT')")] string type,
        [Description("Quantity of items (must be between 1 and 1,000,000)")] int quantity)
    {
        // 1. Authorization check on MCP mutation
        var httpContext = _httpContextAccessor?.HttpContext;
        if (httpContext != null && httpContext.User?.Identity?.IsAuthenticated == false)
        {
            throw new UnauthorizedAccessException("Stock movement operations require an authenticated user with a valid authorization token.");
        }

        string actionUserId = httpContext?.User?.Identity?.Name 
            ?? httpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? "MCP_Assistant";

        // 2. Validate input parameters
        if (string.IsNullOrWhiteSpace(productId))
        {
            throw new ArgumentException("Product ID or name cannot be empty.");
        }

        var normalizedType = type?.Trim().ToUpper();
        if (normalizedType != "IN" && normalizedType != "OUT")
        {
            throw new ArgumentException("Movement type must be 'IN' or 'OUT'.");
        }

        if (quantity <= 0)
        {
            throw new ArgumentException("Quantity must be greater than zero.");
        }

        if (quantity > 1_000_000)
        {
            throw new ArgumentOutOfRangeException(nameof(quantity), "Quantity cannot exceed 1,000,000 in a single transaction.");
        }

        // 3. Resolve Product with disambiguation (Avoid picking wrong product on partial matches)
        var trimmed = productId.Trim();
        var lower = trimmed.ToLower();

        // 3a. Exact match on Product ID
        var targetProduct = await _context.ProductStocks.AsNoTracking()
            .FirstOrDefaultAsync(p => p.ProductId.ToLower() == lower);

        // 3b. Exact match on Product Name
        if (targetProduct == null)
        {
            var exactNameMatches = await _context.ProductStocks.AsNoTracking()
                .Where(p => p.ProductName != null && p.ProductName.ToLower() == lower)
                .ToListAsync();

            if (exactNameMatches.Count == 1)
            {
                targetProduct = exactNameMatches[0];
            }
            else if (exactNameMatches.Count > 1)
            {
                var candidates = string.Join(", ", exactNameMatches.Select(p => $"{p.ProductName} ({p.ProductId})"));
                throw new InvalidOperationException($"Multiple products have the exact name '{productId}': {candidates}. Please specify the unique Product ID.");
            }
        }

        // 3c. Partial match on Product Name (Safe Disambiguation)
        if (targetProduct == null)
        {
            var partialMatches = await _context.ProductStocks.AsNoTracking()
                .Where(p => p.ProductName != null && p.ProductName.ToLower().Contains(lower))
                .Take(5)
                .ToListAsync();

            if (partialMatches.Count == 1)
            {
                targetProduct = partialMatches[0];
            }
            else if (partialMatches.Count > 1)
            {
                var candidates = string.Join(", ", partialMatches.Select(p => $"{p.ProductName} ({p.ProductId})"));
                throw new InvalidOperationException($"Multiple products match '{productId}': {candidates}. Please clarify by providing the exact Product ID or exact name.");
            }
        }

        if (targetProduct == null)
        {
            throw new KeyNotFoundException($"Product '{productId}' was not found.");
        }

        // 4. Atomic Concurrency Control & Database Transaction
        var executionStrategy = _context.Database.CreateExecutionStrategy();
        return await executionStrategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
            try
            {
                // Lock the target product row with UPDLOCK, ROWLOCK to serialize concurrent stock mutations and avoid lost updates
                var product = await _context.ProductStocks
                    .FromSqlInterpolated($"SELECT * FROM ProductStocks WITH (UPDLOCK, ROWLOCK) WHERE ProductId = {targetProduct.ProductId}")
                    .FirstOrDefaultAsync();

                if (product == null)
                {
                    throw new KeyNotFoundException($"Product '{targetProduct.ProductId}' was not found during transaction execution.");
                }

                int currentStock = product.CurrentStock ?? 0;
                int newStock = currentStock;

                if (normalizedType == "IN")
                {
                    newStock += quantity;
                }
                else // OUT
                {
                    if (currentStock < quantity)
                    {
                        throw new InvalidOperationException($"Insufficient stock for '{product.ProductName ?? product.ProductId}'. Available: {currentStock}, Requested: {quantity}.");
                    }
                    newStock -= quantity;
                }

                var now = DateTime.UtcNow;

                product.CurrentStock = newStock;
                product.TotalTransactionsCount = (product.TotalTransactionsCount ?? 0) + 1;
                product.LastUpdatedDate = now;

                var movement = new StockMovement
                {
                    MovementId = Guid.NewGuid().ToString(),
                    ProductId = product.ProductId,
                    Quantity = quantity,
                    Type = normalizedType,
                    MovementDate = now
                };

                var auditLog = new StockAuditLog
                {
                    AuditLogId = Guid.NewGuid().ToString(),
                    ProductId = product.ProductId,
                    MovementType = normalizedType,
                    QuantityChanged = quantity,
                    OldStock = currentStock,
                    NewStock = newStock,
                    ActionByUserId = actionUserId,
                    LogTimestamp = now
                };

                await _context.StockMovements.AddAsync(movement);
                await _context.StockAuditLogs.AddAsync(auditLog);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new StockMovementToolResponse
                {
                    MovementId = movement.MovementId,
                    ProductId = movement.ProductId,
                    ProductName = product.ProductName ?? product.ProductId,
                    Type = normalizedType,
                    Quantity = quantity,
                    RemainingStock = newStock,
                    Message = $"Stock movement recorded successfully. Product: {product.ProductName ?? product.ProductId}, Type: {normalizedType}, Quantity: {quantity}, New Stock: {newStock}."
                };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        });
    }
}
