using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockMovementTrackerSystem.Api.Helper;
using StockMovementTrackerSystem.Application.Interfaces;
using StockMovementTrackerSystem.Application.Models;
using StockMovementTrackerSystem.Domain.Entities;
using StockMovementTrackerSystem.Infrastructure.Persistence;

namespace StockMovementTrackerSystem.Api.Controllers.process;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class StocksMovementController(
    StockMovementTrackerSystemDbContext context,
    IIdGenerationService idGenerationService) : ControllerBase
{
    [HttpGet("list-stockmove")]
    [EndpointSummary("List of a StockMovement")]
    [EndpointDescription("List of a ProductStockSummary.")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ListAsync()
    {
        var stockMovement = await context.StockMovements
            .Include(x => x.Product)
            .OrderByDescending(x => x.MovementDate)
            .AsNoTracking()
            .ToListAsync();

        return ResponseHelper.Ok_Result(stockMovement, null);
    }

    [HttpGet("product-summary")]
    [EndpointSummary("List of a ProductStockSummary")]
    [EndpointDescription("List of a ProductStockSummary.")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SummaryListAsync()
    {
        var stockMovement = await context.ViProductStockSummaries
            .AsNoTracking()
            .ToListAsync();

        return ResponseHelper.Ok_Result(stockMovement, null);
    }

    [HttpPost("stock")]
    [EndpointSummary("Create StockProduct")]
    [EndpointDescription("Create a new Stocks Movement transaction with concurrency lock and atomic transaction.")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatedAsync(StockMovementModel model)
    {
        var executionStrategy = context.Database.CreateExecutionStrategy();
        return await executionStrategy.ExecuteAsync<IActionResult>(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
            try
            {
                var productStock = await context.ProductStocks
                    .FromSqlInterpolated($"SELECT * FROM ProductStocks WITH (UPDLOCK, ROWLOCK) WHERE ProductId = {model.ProductId}")
                    .FirstOrDefaultAsync();

                if (productStock == null)
                {
                    return NotFound("Product not found in system.");
                }

                int inputQuantity = model.Quantity;
                int oldStock = productStock.CurrentStock ?? 0;
                int newStock = oldStock;
                int totalTrx = productStock.TotalTransactionsCount ?? 0;

                if (model.Type == "IN")
                {
                    newStock = oldStock + inputQuantity;
                    totalTrx += 1;
                }
                else if (model.Type == "OUT")
                {
                    if (oldStock < inputQuantity)
                    {
                        return ResponseHelper.Bad_Request("Current Stock Item is Invalid! (Insufficient stock)", null);
                    }
                    newStock = oldStock - inputQuantity;
                    totalTrx += 1;
                }

                var now = DateTime.UtcNow;

                productStock.CurrentStock = newStock;
                productStock.TotalTransactionsCount = totalTrx;
                productStock.LastUpdatedDate = now;

                model.MovementId = idGenerationService.GetJounerId();

                var stockMove = new StockMovement
                {
                    MovementId = model.MovementId,
                    ProductId = model.ProductId,
                    Quantity = model.Quantity,
                    Type = model.Type,
                    MovementDate = now
                };

                context.StockMovements.Add(stockMove);

                var auditlog = new StockAuditLog
                {
                    AuditLogId = Guid.NewGuid().ToString(),
                    ProductId = model.ProductId,
                    MovementType = model.Type,
                    QuantityChanged = inputQuantity,
                    OldStock = oldStock,
                    NewStock = newStock,
                    ActionByUserId = User.Identity?.Name ?? "System",
                    LogTimestamp = now
                };
                context.StockAuditLogs.Add(auditlog);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                var currentViewData = await context.ViProductStockSummaries
                    .Where(x => x.ProductId == model.ProductId)
                    .OrderByDescending(x => x.MovementDate)
                    .FirstOrDefaultAsync();

                return ResponseHelper.Ok_Result(new { stockMove, currentViewData }, null);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        });
    }

    [HttpPut("update-stockmove")]
    [EndpointSummary("Update StockMovement")]
    [EndpointDescription("Update StockMovement with concurrency lock and atomic transaction.")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateStockMoveAsync(string movementId, StockMovementModel model)
    {
        var executionStrategy = context.Database.CreateExecutionStrategy();
        return await executionStrategy.ExecuteAsync<IActionResult>(async () =>
        {
            await using var transaction = await context.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted);
            try
            {
                var productStock = await context.ProductStocks
                    .FromSqlInterpolated($"SELECT * FROM ProductStocks WITH (UPDLOCK, ROWLOCK) WHERE ProductId = {model.ProductId}")
                    .FirstOrDefaultAsync();

                var stockMove = await context.StockMovements.FirstOrDefaultAsync(x => x.MovementId == movementId);

                if (stockMove == null || productStock == null)
                {
                    return NotFound("ProductStock not found in system.");
                }

                int inputQuantity = Convert.ToInt32(model.Quantity);
                int oldStock = productStock.CurrentStock ?? 0;
                int newStock = oldStock;
                int totalTrx = productStock.TotalTransactionsCount ?? 0;

                stockMove.Quantity = model.Quantity;
                stockMove.Type = model.Type;

                context.StockMovements.Update(stockMove);

                if (model.Type == "IN")
                {
                    newStock = oldStock + inputQuantity;
                    totalTrx += 1;
                }
                else if (model.Type == "OUT")
                {
                    if (oldStock < inputQuantity)
                    {
                        return ResponseHelper.Bad_Request("Current Stock Item is Invalid! (Insufficient stock)", null);
                    }
                    newStock = oldStock - inputQuantity;
                }

                var now = DateTime.UtcNow;

                productStock.CurrentStock = newStock;
                productStock.TotalTransactionsCount = totalTrx;
                productStock.LastUpdatedDate = now;

                context.ProductStocks.Update(productStock);

                var auditlog = new StockAuditLog
                {
                    AuditLogId = Guid.NewGuid().ToString(),
                    ProductId = model.ProductId,
                    MovementType = model.Type,
                    QuantityChanged = inputQuantity,
                    OldStock = oldStock,
                    NewStock = newStock,
                    ActionByUserId = User.Identity?.Name ?? "System",
                    LogTimestamp = now
                };
                context.StockAuditLogs.Add(auditlog);

                var stockAlerts = new StockAlert
                {
                    AlertId = Guid.NewGuid().ToString(),
                    ProductId = model.ProductId,
                    AlertMessage = "CurrentStock is Less Than 5",
                    IsResolved = true,
                    CreatedDate = now
                };
                if (productStock.CurrentStock < 5)
                {
                    context.StockAlerts.Add(stockAlerts);
                }

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                return ResponseHelper.Ok_Result(new { stockMove, productStock, auditlog, stockAlerts }, null);
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        });
    }
}
