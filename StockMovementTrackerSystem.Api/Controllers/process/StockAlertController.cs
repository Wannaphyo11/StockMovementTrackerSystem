using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockMovementTrackerSystem.Api.Helper;
using StockMovementTrackerSystem.Application.Interfaces;
using StockMovementTrackerSystem.Domain.Entities;
using StockMovementTrackerSystem.Infrastructure.Persistence;

namespace StockMovementTrackerSystem.Api.Controllers.process;

[Authorize]
[Route("api/process/[controller]")]
[ApiController]
public class StockAlertController(StockMovementTrackerSystemDbContext context,
    IIdGenerationService idGenerationService): ControllerBase
{
    [HttpGet]
    [EndpointSummary("List")]
    [EndpointDescription("List of a ProductStockSummary.")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetStockAlertAsync(StockAlert alert)
    {
        var product = await context.ProductStocks.Select(x => x.CurrentStock < 5).ToListAsync();
        if (product != null) {
            alert.AlertId = idGenerationService.GetJounerId();
            alert.AlertMessage = "current stock is less than 5";
            alert.IsResolved= true;
            alert.CreatedDate = DateTime.Now;
        }
        context.StockAlerts.Add(alert);
        await context.SaveChangesAsync();
        return ResponseHelper.Ok_Result(product,null);

    }
}
