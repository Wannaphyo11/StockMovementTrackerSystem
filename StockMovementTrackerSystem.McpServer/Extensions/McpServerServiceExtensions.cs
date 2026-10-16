using Microsoft.Extensions.DependencyInjection;
using ModelContextProtocol.Server;
using StockMovementTrackerSystem.McpServer.Tools;
using StockMovementTrackerSystem.McpServer.Tools.Alerts;
using StockMovementTrackerSystem.McpServer.Tools.Analytics;
using StockMovementTrackerSystem.McpServer.Tools.Inventory;
using StockMovementTrackerSystem.McpServer.Tools.Movements;

namespace StockMovementTrackerSystem.McpServer.Extensions;

/// <summary>
/// Provides clean, modular Dependency Injection and MCP tool registration extension methods.
/// Groups tools logically by domain to maintain high cohesion and clean architecture.
/// </summary>
public static class McpServerServiceExtensions
{
    /// <summary>
    /// Registers all categorized MCP tool classes into the DI container as Scoped services.
    /// </summary>
    public static IServiceCollection AddStockMovementMcpTools(this IServiceCollection services)
    {
        services.AddScoped<ProductStockTool>();
        services.AddScoped<ProductStockQueryTools>();
        services.AddScoped<StockMovementTool>();
        services.AddScoped<StockMovementCommandTools>();
        services.AddScoped<StockAlertTool>();
        services.AddScoped<InventoryAnalyticsTool>();
        services.AddScoped<ServerTimeTool>();

        return services;
    }

    /// <summary>
    /// Registers all Domain MCP Tools into the MCP Server pipeline.
    /// </summary>
    public static IMcpServerBuilder WithStockMovementTools(this IMcpServerBuilder builder)
    {
        return builder
            .WithInventoryTools()
            .WithMovementTools()
            .WithAlertTools()
            .WithAnalyticsTools()
            .WithSystemTools();
    }

    /// <summary>
    /// Domain: Inventory & Product Stock Tools (Read queries)
    /// </summary>
    public static IMcpServerBuilder WithInventoryTools(this IMcpServerBuilder builder)
    {
        return builder.WithTools<ProductStockTool>();
    }

    /// <summary>
    /// Domain: Stock Movement Transactions (Audit & IN/OUT Commands)
    /// </summary>
    public static IMcpServerBuilder WithMovementTools(this IMcpServerBuilder builder)
    {
        return builder.WithTools<StockMovementTool>();
    }

    /// <summary>
    /// Domain: Stock Alert Notifications
    /// </summary>
    public static IMcpServerBuilder WithAlertTools(this IMcpServerBuilder builder)
    {
        return builder.WithTools<StockAlertTool>();
    }

    /// <summary>
    /// Domain: Inventory Analytics & Overview Statistics
    /// </summary>
    public static IMcpServerBuilder WithAnalyticsTools(this IMcpServerBuilder builder)
    {
        return builder.WithTools<InventoryAnalyticsTool>();
    }

    /// <summary>
    /// Domain: System Diagnostics & Health Tools
    /// </summary>
    public static IMcpServerBuilder WithSystemTools(this IMcpServerBuilder builder)
    {
        return builder.WithTools<ServerTimeTool>();
    }
}
