using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using StockMovementTrackerSystem.Api.Extensions;
using StockMovementTrackerSystem.Api.Middlewares;
using StockMovementTrackerSystem.Application.Interfaces;
using StockMovementTrackerSystem.Infrastructure.Persistence;
using StockMovementTrackerSystem.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
// Db Config
builder.Services.AddDbAndIdentityConfig(builder.Configuration);

// JWT Auth Config
builder.Services.AddJWTAuthConfig(builder.Configuration);

// MISC Config
builder.Services.AddMiscConfig();

// Core
builder.Services.AddCoreScopedConfig();

// Add services to the container.
builder.Services.AddControllers();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddScoped<IEncryptionService, EncryptionService>();
builder.Services.AddScoped<IIdGenerationService, IdGenerationService>();

var app = builder.Build();

app.UseMiddleware<EncryptionMiddleware>();
app.UseMiddleware<GlobalExceptionMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference("/docs/scalar");
}

app.UseHttpsRedirection();

app.UseCors("AllowedCorsOrigins");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
