using Microsoft.EntityFrameworkCore;
using StockMovementTrackerSystem.Infrastructure.Persistence;
using StockMovementTrackerSystem.McpServer.Tools;

var builder = WebApplication.CreateBuilder(args);

// Database Connection
builder.Services.AddDbContext<StockMovementTrackerSystemDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register MCP Tools
builder.Services.AddScoped<StockTool>();
builder.Services.AddScoped<ServerTimeTool>();

builder.Services
    .AddMcpServer()
    .WithHttpTransport()
    .WithTools<StockTool>()
    .WithTools<ServerTimeTool>();

var app = builder.Build();

app.MapMcp("/mcp");

app.Run();