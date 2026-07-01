using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockMovementTrackerSystem.Api.Helper;
using StockMovementTrackerSystem.Application.Models;
using StockMovementTrackerSystem.Domain.Entities;
using StockMovementTrackerSystem.Infrastructure.Persistence;
using System.Linq.Dynamic.Core;

namespace StockMovementTrackerSystem.Api.Controllers.Master;

//[Authorize]
[Route("api/[controller]")]
[ApiController]
public class StocksMovementController(
    StockMovementTrackerSystemDbContext context) : ControllerBase
{
    [HttpGet]
    [EndpointSummary("List")]
    [EndpointDescription("Create a new Stocks Movement transaction.")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetProductStockAsync()
    {
        var productStock = await context.ViProductStockSummaries.AsNoTracking().ToListAsync();
        return ResponseHelper.Ok_Result(productStock, null);
    }

    [HttpGet("auditlogs")]
    [EndpointSummary("AuditLog - List")]
    [EndpointDescription("AuditLog - List.")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAuditLogAsync(string productId)
    {
        var audit = await context.StockAuditLogs.Where(x=>x.ProductId == productId).ToListAsync();
        return ResponseHelper.Ok_Result(audit, null);
    }


    [HttpPost("stock")]
    [EndpointSummary("Create StockProduct")]
    [EndpointDescription("Create a new Stocks Movement transaction.")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatedAsync(StockMovementModel model)
    {
        var productStock = await context.ProductStocks.FirstOrDefaultAsync(x => x.ProductId == model.ProductId);
        if (productStock == null)
        {
            return NotFound("Product not found in system.");
        }

        int inputQuantity = Convert.ToInt32(model.Quantity);
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

        productStock.CurrentStock = newStock;
        productStock.TotalTransactionsCount = totalTrx;
        productStock.CreatedDate = DateTime.Now;
        productStock.LastUpdatedDate = DateTime.Now;

        var stockMove = new StockMovement
        {
            MovementId = model.MovementId,
            ProductId = model.ProductId,
            Quantity = model.Quantity,
            Type = model.Type,
            MovementDate = DateTime.Now
        };

        context.StockMovements.Add(stockMove);

        var auditlog = new StockAuditLog()
        {
            AuditLogId = Guid.NewGuid().ToString(),
            ProductId = model.ProductId,
            MovementType = model.Type,
            QuantityChanged = inputQuantity,
            OldStock = oldStock,
            NewStock = newStock,
            ActionByUserId = User.Identity?.Name ?? "System",
            LogTimestamp = DateTime.Now
        };
        context.StockAuditLogs.Add(auditlog);

        await context.SaveChangesAsync();

        var currentViewData = await context.ViProductStockSummaries
         .Where(x => x.ProductId == model.ProductId)
         .OrderByDescending(x => x.MovementDate)
         .FirstOrDefaultAsync();

        return ResponseHelper.Ok_Result(new { stockMove, currentViewData }, null);
    }
}
