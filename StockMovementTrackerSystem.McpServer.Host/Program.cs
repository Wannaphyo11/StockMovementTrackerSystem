using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ModelContextProtocol.AspNetCore;
using ModelContextProtocol.Server;
using StockMovementTrackerSystem.Infrastructure.Persistence;
using StockMovementTrackerSystem.McpServer.Extensions;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Database Connection
builder.Services.AddDbContext<StockMovementTrackerSystemDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddHttpContextAccessor();

// Configure JWT Authentication & Authorization
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.SaveToken = true;
    options.RequireHttpsMetadata = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidAudience = builder.Configuration["JWT:ValidAudience"],
        ValidIssuer = builder.Configuration["JWT:ValidIssuer"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JWT:Secret"] ?? string.Empty)),
        ClockSkew = TimeSpan.FromHours(1)
    };
});

builder.Services.AddAuthorization();

// Register Modular MCP Tools in DI Container
builder.Services.AddStockMovementMcpTools();

// Configure MCP Server with Modern Stateless HTTP Transport and Classified Tools
builder.Services
    .AddMcpServer()
    .WithHttpTransport(options =>
    {
        options.SessionMode = HttpServerSessionMode.Stateless;
    })
    .WithStockMovementTools();

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

// Enforce authentication on MCP endpoint to secure tools against unauthorized direct callers
app.MapMcp("/mcp").RequireAuthorization();

app.Run("http://localhost:5177");