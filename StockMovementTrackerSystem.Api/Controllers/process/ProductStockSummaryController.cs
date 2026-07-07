using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockMovementTrackerSystem.Api.Helper;
using StockMovementTrackerSystem.Infrastructure.Persistence;

namespace StockMovementTrackerSystem.Api.Controllers.process;

//[Authorize]
[Route("api/process/[controller]")]
[ApiController]
public class ProductStockSummaryController(StockMovementTrackerSystemDbContext context) : ControllerBase
{
    [HttpGet]
    [EndpointSummary("List")]
    [EndpointDescription("List of a ProductStockSummary.")]
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
        var audit = await context.StockAuditLogs.Where(x => x.ProductId == productId).ToListAsync();
        return ResponseHelper.Ok_Result(audit, null);
    }

}
