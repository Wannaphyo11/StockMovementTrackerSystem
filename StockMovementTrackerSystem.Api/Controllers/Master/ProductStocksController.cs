using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockMovementTrackerSystem.Api.Helper;
using StockMovementTrackerSystem.Application.Interfaces;
using StockMovementTrackerSystem.Application.Models;
using StockMovementTrackerSystem.Domain.Entities;
using StockMovementTrackerSystem.Infrastructure.Persistence;
using StockMovementTrackerSystem.Infrastructure.Services;
using System.Globalization;

namespace StockMovementTrackerSystem.Api.Controllers.Master;

[Authorize]
[Route("api/master/[controller]")]
[ApiController]
public class ProductStocksController(StockMovementTrackerSystemDbContext context,
    IIdGenerationService idGenerationService) : ControllerBase
{
    [HttpGet]
    [EndpointSummary("List of ProductStock.")]
    [EndpointDescription("List of ProductStock.")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetProductAsync()
    {
        var list = await context.ProductStocks.ToListAsync();
        return ResponseHelper.Ok_Result(list, null);
    }

    [HttpPost("product")]
    [EndpointSummary("Create Product")]
    [EndpointDescription("Create a new Product.")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateProductAsync(ProductStocksModel model)
    {
        model.ProductId = idGenerationService.GetJounerId();

        var productStock = new ProductStock
        {
            ProductId = model.ProductId,
            ProductName = model.ProductName,
            CurrentStock = model.CurrentStock,
            TotalTransactionsCount = model.TotalTransactionsCount,
            CreatedDate = DateTime.UtcNow,
            LastUpdatedDate = DateTime.UtcNow
        };

        context.ProductStocks.Add(productStock);
        return await context.SaveChangesAsync() > 0
            ? ResponseHelper.Ok_Result(productStock, new DefaultResponseMessageModel("ProductStock created successfully.", ""))
        : ResponseHelper.Bad_Request(null, new DefaultResponseMessageModel("Failed to create product stock.", ""));

    }

    [HttpPut("update")]
    [EndpointSummary("Create Product")]
    [EndpointDescription("Create a new Product.")]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProductAsync(string productId, ProductStocksModel model)
    {
        var productStock = await context.ProductStocks.FirstOrDefaultAsync(x => x.ProductId == productId);
        if (productStock == null)
        {
            return NotFound("Product Stock is not found.");
        }
        productStock.ProductName = model.ProductName;
        productStock.CurrentStock = model.CurrentStock;
        productStock.TotalTransactionsCount = model.TotalTransactionsCount;
        productStock.LastUpdatedDate = DateTime.UtcNow;

        context.ProductStocks.Update(productStock);
        return await context.SaveChangesAsync() > 0
            ? ResponseHelper.Ok_Result(productStock, new DefaultResponseMessageModel("Product Stock updated successfully.", ""))
                : ResponseHelper.Bad_Request(null, new DefaultResponseMessageModel("Failed to update ProductStock.", ""));
    }
}
