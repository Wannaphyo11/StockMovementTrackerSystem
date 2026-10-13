using System;
using System.ClientModel;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Client;
using OpenAI;
using StockMovementTrackerSystem.Application.Interfaces.Repositories;
using StockMovementTrackerSystem.Application.Interfaces.Services;
using StockMovementTrackerSystem.Application.Models.Chat;
using StockMovementTrackerSystem.Domain.Entities;
namespace StockMovementTrackerSystem.Infrastructure.Services;

public class ChatService : IChatService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ICurrentUserService _currentUserService;
    private readonly IChatConversationRepository _conversationRepository;
    private readonly IChatMessageRepository _messageRepository;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ChatService> _logger;

    public ChatService(
        IHttpContextAccessor httpContextAccessor,
        ICurrentUserService currentUserService,
        IChatConversationRepository conversationRepository,
        IChatMessageRepository messageRepository,
        IConfiguration configuration,
        ILogger<ChatService> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _currentUserService = currentUserService;
        _conversationRepository = conversationRepository;
        _messageRepository = messageRepository;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<ChatResponseModel> SendMessageAsync(ChatRequestModel request)
    {
        // 1. Get Current User
        var userId = _currentUserService.UserId;
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Current user could not be identified.");
        }

        _logger.LogInformation("Chat request received from UserId: {UserId}", userId);

        // 2. Get Authorization Header to pass along to MCP Server if needed
        var authorizationHeader = _httpContextAccessor
            .HttpContext?
            .Request
            .Headers["Authorization"]
            .ToString();

        // 3. Get or Create Conversation
        ChatConversation? conversation;
        if (request.ConversationId.HasValue)
        {
            conversation = await _conversationRepository.GetByIdAsync(request.ConversationId.Value, userId);
            if (conversation is null)
            {
                throw new KeyNotFoundException("Conversation not found.");
            }
        }
        else
        {
            var title = request.Message.Length > 50
                ? request.Message[..50]
                : request.Message;
            conversation = await _conversationRepository.CreateAsync(userId, title);
        }

        // 4. Save User Message to Database
        var userMessage = new Domain.Entities.ChatMessage
        {
            Id = Guid.NewGuid(),
            ConversationId = conversation.Id,
            Role = "user",
            Content = request.Message,
            CreatedAt = DateTime.UtcNow
        };
        await _messageRepository.AddAsync(userMessage);
        _logger.LogInformation("User message saved. ConversationId: {ConversationId}", conversation.Id);

        // 5. Load Conversation History
        var history = await _messageRepository.GetByConversationIdAsync(conversation.Id);
        _logger.LogInformation("Loaded {Count} messages from conversation {ConversationId}.", history.Count, conversation.Id);

        // 6. Connect to MCP Server (with Fallback to in-process StockTool)
        IList<AITool> tools = [];
        McpClient? mcpClient = null;

        var mcpServerUrl = _configuration["Mcp:ServerUrl"] 
            ?? _configuration["AI:McpServerUrl"] 
            ?? "http://localhost:5177/mcp";

        try
        {
            var headers = !string.IsNullOrWhiteSpace(authorizationHeader)
                ? new Dictionary<string, string> { ["Authorization"] = authorizationHeader }
                : null;

            var clientTransport = new HttpClientTransport(
                new HttpClientTransportOptions
                {
                    Endpoint = new Uri(mcpServerUrl),
                    TransportMode = HttpTransportMode.StreamableHttp,
                    AdditionalHeaders = headers
                });

            mcpClient = await McpClient.CreateAsync(clientTransport);
            _logger.LogInformation("Connected to Stock Movement MCP Server at {Url}", mcpServerUrl);

            var discoveredTools = await mcpClient.ListToolsAsync();
            tools = [.. discoveredTools];
            _logger.LogInformation("Discovered {Count} MCP tools over HTTP.", tools.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to connect to MCP Server at {Url} or discover tools. Proceeding without MCP tools.", mcpServerUrl);
        }

        try
        {
            // 7. Configure AI Client (OpenRouter / OpenAI)
            var apiKey = _configuration["AI:ApiKey"] 
                ?? _configuration["OpenRouter:ApiKey"]
                ?? throw new InvalidOperationException("AI:ApiKey is not configured.");

            var modelName = _configuration["AI:Model"] 
                ?? _configuration["OpenRouter:Model"] 
                ?? "google/gemini-2.0-flash-exp:free";

            var baseUrl = _configuration["AI:BaseUrl"] 
                ?? "https://openrouter.ai/api/v1";

            var openAIClient = new OpenAIClient(
                new ApiKeyCredential(apiKey),
                new OpenAIClientOptions
                {
                    Endpoint = new Uri(baseUrl)
                });

            IChatClient aiClient = openAIClient
                .GetChatClient(modelName)
                .AsIChatClient()
                .AsBuilder()
                .UseFunctionInvocation()
                .Build();

            // 8. Convert DB History to AI Chat Messages + System Prompt
            var chatMessages = new List<Microsoft.Extensions.AI.ChatMessage>
            {
                new(
                    ChatRole.System,
                    $"You are the intelligent, helpful AI Inventory Assistant for StockMovementTrackerSystem.\n" +
                    $"The current authenticated user ID is: {userId}.\n\n" +
                    $"CRITICAL TOOL SELECTION RULES:\n" +
                    $"1. 'get_product_stock': Use when the user asks about a specific product's stock quantity, ID, or status.\n" +
                    $"2. 'get_low_stock_products': Use when the user asks for low stock items, running out of stock, or threshold checks.\n" +
                    $"3. 'get_stock_movement_history': Use when the user asks for recent stock in/out movements, transfers, or transaction records.\n" +
                    $"4. 'get_active_stock_alerts': Use when the user asks about stock alerts, warnings, or unresolved issues.\n" +
                    $"5. 'get_inventory_summary': Use when the user asks for an overall inventory overview, warehouse status, or total counts.\n\n" +
                    $"PRESENTATION GUIDELINES:\n" +
                    $"- Always use the tools to query live data from the database.\n" +
                    $"- Answer politely and clearly in Myanmar or English according to the user's prompt language.\n" +
                    $"- Format lists and data cleanly using markdown tables or bullet points.\n" +
                    $"- Never invent product IDs, quantities, or movements. If a product is not found, politely let the user know.\n")
            };

            foreach (var message in history.OrderBy(m => m.CreatedAt))
            {
                if (message.Role.Equals("user", StringComparison.OrdinalIgnoreCase))
                {
                    chatMessages.Add(new Microsoft.Extensions.AI.ChatMessage(ChatRole.User, message.Content));
                }
                else if (message.Role.Equals("assistant", StringComparison.OrdinalIgnoreCase))
                {
                    chatMessages.Add(new Microsoft.Extensions.AI.ChatMessage(ChatRole.Assistant, message.Content));
                }
            }

            // 9. Send Conversation History + Tools to AI
            var chatOptions = new ChatOptions();
            if (tools.Count > 0)
            {
                chatOptions.Tools = [.. tools];
            }

            var response = await aiClient.GetResponseAsync(chatMessages, chatOptions);

            // 10. Log AI Tool Calls
            foreach (var msg in response.Messages)
            {
                foreach (var content in msg.Contents)
                {
                    if (content is FunctionCallContent functionCall)
                    {
                        _logger.LogInformation("AI Tool Call: {ToolName}", functionCall.Name);
                        _logger.LogInformation("Tool Arguments: {Arguments}",
                            System.Text.Json.JsonSerializer.Serialize(functionCall.Arguments));
                    }
                    else if (content is FunctionResultContent functionResult)
                    {
                        _logger.LogInformation("AI Tool Result: {Result}", functionResult.Result);
                    }
                }
            }

            // 11. Extract AI Text Response
            var aiMessageText = response.Text;
            if (string.IsNullOrWhiteSpace(aiMessageText))
            {
                aiMessageText = response.Messages
                    .LastOrDefault(m => m.Role == ChatRole.Assistant && !string.IsNullOrWhiteSpace(m.Text))
                    ?.Text ?? string.Empty;
            }

            if (string.IsNullOrWhiteSpace(aiMessageText))
            {
                aiMessageText = "Request processed successfully.";
            }

            // 12. Save AI Message to Database
            var assistantMessage = new Domain.Entities.ChatMessage
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                Role = "assistant",
                Content = aiMessageText,
                CreatedAt = DateTime.UtcNow
            };
            await _messageRepository.AddAsync(assistantMessage);

            // 13. Update Conversation Timestamp
            conversation.UpdatedAt = DateTime.UtcNow;
            await _conversationRepository.UpdateAsync(conversation);

            // 14. Return AI Response
            return new ChatResponseModel
            {
                ConversationId = conversation.Id,
                Message = aiMessageText
            };
        }
        finally
        {
            if (mcpClient != null)
            {
                try
                {
                    await mcpClient.DisposeAsync();
                }
                catch { }
            }
        }
    }

    public async Task<ChatHistoryResponseModel> GetConversationAsync(Guid conversationId)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Current user could not be identified.");
        }

        var conversation = await _conversationRepository.GetByIdAsync(conversationId, userId);
        if (conversation == null)
        {
            throw new KeyNotFoundException("Conversation not found.");
        }

        var messages = await _messageRepository.GetByConversationIdAsync(conversation.Id);

        return new ChatHistoryResponseModel
        {
            ConversationId = conversation.Id,
            Title = conversation.Title ?? string.Empty,
            Messages = messages.OrderBy(x => x.CreatedAt).Select(x => new ChatHistoryMessageModel
            {
                Role = x.Role,
                Content = x.Content,
                CreatedAt = x.CreatedAt
            }).ToList()
        };
    }

    public async Task<List<ChatConversationListResponseModel>> GetConversationsAsync()
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Current user could not be identified.");
        }

        var conversations = await _conversationRepository.GetByUserIdAsync(userId);

        return conversations.Select(x => new ChatConversationListResponseModel
        {
            Id = x.Id,
            Title = x.Title ?? string.Empty,
            CreatedAt = x.CreatedAt,
            UpdatedAt = x.UpdatedAt
        }).ToList();
    }

    public async Task DeleteConversationAsync(Guid conversationId)
    {
        var userId = _currentUserService.UserId;
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new UnauthorizedAccessException("Current user could not be identified.");
        }

        var deleted = await _conversationRepository.DeleteAsync(conversationId, userId);
        if (!deleted)
        {
            throw new KeyNotFoundException("Conversation not found.");
        }

        _logger.LogInformation("Conversation deleted. ConversationId: {ConversationId}, UserId: {UserId}", conversationId, userId);
    }
}
