using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using OpenAI;
using Scalar.AspNetCore;
using StockMovementTrackerSystem.Api.Extensions;
using StockMovementTrackerSystem.Api.Middlewares;
using StockMovementTrackerSystem.Application.Interfaces;
using StockMovementTrackerSystem.Application.Models;
using StockMovementTrackerSystem.Infrastructure.Persistence;
using StockMovementTrackerSystem.Infrastructure.Services;
using System.ClientModel;

var builder = WebApplication.CreateBuilder(args);

var aiApiKey = builder.Configuration["AI:ApiKey"]
    ?? throw new InvalidOperationException("AI:ApiKey is missing.");

var aiBaseUrl = builder.Configuration["AI:BaseUrl"]
    ?? throw new InvalidOperationException("AI:BaseUrl is missing.");

var aiModel = builder.Configuration["AI:Model"]
    ?? throw new InvalidOperationException("AI:Model is missing.");

builder.Services.AddSingleton<IChatClient>(_ =>
{
    var openAIClient = new OpenAIClient(
        new ApiKeyCredential(aiApiKey),
        new OpenAIClientOptions
        {
            Endpoint = new Uri(aiBaseUrl)
        });
    return openAIClient
       .GetChatClient(aiModel)
       .AsIChatClient()
       .AsBuilder()
       .UseFunctionInvocation()
       .Build();
});

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();
// Db Config
builder.Services.AddDbAndIdentityConfig(builder.Configuration);

// JWT Auth Config
builder.Services.AddJWTAuthConfig(builder.Configuration);

// MISC Config
builder.Services.AddMiscConfig();

// Core
builder.Services.AddCoreScopedConfig();
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection(EmailSettings.SectionName));

// Add services to the container.
builder.Services.AddControllers();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddScoped<IEncryptionService, EncryptionService>();
builder.Services.AddScoped<IIdGenerationService, IdGenerationService>();
builder.Services.AddScoped<StockMovementTrackerSystem.McpServer.Tools.StockTool>();

// AI Chat Services (matching SocialMediaApp architecture)
builder.Services.AddScoped<StockMovementTrackerSystem.Application.Interfaces.Services.ICurrentUserService, StockMovementTrackerSystem.Infrastructure.Services.CurrentUserService>();
builder.Services.AddScoped<StockMovementTrackerSystem.Application.Interfaces.Repositories.IChatConversationRepository, StockMovementTrackerSystem.Infrastructure.Repositories.ChatConversationRepository>();
builder.Services.AddScoped<StockMovementTrackerSystem.Application.Interfaces.Repositories.IChatMessageRepository, StockMovementTrackerSystem.Infrastructure.Repositories.ChatMessageRepository>();
builder.Services.AddScoped<StockMovementTrackerSystem.Application.Interfaces.Services.IChatService, StockMovementTrackerSystem.Infrastructure.Services.ChatService>();

var app = builder.Build();

app.UseMiddleware<EncryptionMiddleware>();
app.UseMiddleware<GlobalExceptionMiddleware>();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
   
}

app.MapOpenApi();
app.MapScalarApiReference("/docs/scalar");

app.UseHttpsRedirection();

app.UseCors("AllowedCorsOrigins");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
