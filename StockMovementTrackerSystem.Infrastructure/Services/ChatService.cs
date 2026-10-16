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

        // 6. Connect to MCP Server
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
                    $"TOOL USAGE & SELECTION GUIDELINES:\n" +
                    $"- You have access to specialized external tools via function calling. Always inspect the provided tools, their descriptions, and parameter schemas to select the best tool matching the user's intent.\n" +
                    $"- Always focus on answering the user's LATEST message.\n" +
                    $"- When the user asks to sell, issue, or remove stock (e.g., 'ရောင်းထုတ်ပေးပါ', 'ထုတ်ပေးပါ', 'sell', 'stock out'), call `CreateStockMovement` with `type: \"OUT\"` and the requested quantity.\n" +
                    $"- When the user asks to add, restock, or receive stock (e.g., 'အဝင်သွင်းပေးပါ', 'ထပ်ထည့်ပေးပါ', 'stock in'), call `CreateStockMovement` with `type: \"IN\"` and the requested quantity.\n" +
                    $"- You can pass either the exact Product ID or Product Name (e.g., 'Cake') to `CreateStockMovement`, or look up the product first with `GetProductStock`.\n\n" +
                    $"PRESENTATION GUIDELINES:\n" +
                    $"- Always use the tools to query live data from the database.\n" +
                    $"- Answer politely and clearly in Myanmar or English according to the user's prompt language.\n" +
                    $"- NEVER mix Chinese characters (such as 数量) or other unrelated languages into Myanmar or English responses.\n" +
                    $"- NEVER repeat words or phrases (such as 'ပြီး ချက်ခြင်း'). Keep sentences short and natural, and prefer bullet points or tables over long Burmese prose.\n" +
                    $"- When `CreateStockMovement` succeeds, ALWAYS respond using this exact clean bullet format (do not write long paragraphs):\n" +
                    $"  **စတော့ မှတ်တမ်းတင်ပြီးပါပြီ**\n" +
                    $"  - **ပစ္စည်းအမည်:** [ProductName] ([ProductId])\n" +
                    $"  - **အမျိုးအစား:** [IN / OUT]\n" +
                    $"  - **အရေအတွက်:** [Quantity] ခု\n" +
                    $"  - **လက်ကျန်စတော့:** [RemainingStock] ခု\n" +
                    $"- Be direct, concise, and professional. Avoid conversational fluff or repetitive intros.\n" +
                    $"- Format lists cleanly with compact markdown tables or concise bullet points.\n" +
                    $"- If a list is long, summarize the top 5 most relevant items and state the total count unless the user specifically asks for all.\n" +
                    $"- Never invent product IDs, quantities, or movements. If a product is not found, politely let the user know.\n")
            };

            // 8. Convert DB History to AI Chat Messages + System Prompt (Token-Based Sliding Window with Safety Headroom)
            int maxContextTokens = _configuration.GetValue<int>("AI:MaxContextTokens", 4000);
            if (maxContextTokens <= 0)
            {
                maxContextTokens = 4000;
            }

            // Reserve headroom buffer for System Prompt, MCP Tool Definitions, and LLM Output Generation
            const int SafetyReserveTokens = 600;
            int effectiveHistoryBudget = Math.Max(500, maxContextTokens - SafetyReserveTokens);

            var orderedHistory = history.OrderByDescending(m => m.CreatedAt).ToList();
            var selectedMessages = new List<Domain.Entities.ChatMessage>();
            int accumulatedTokens = 0;

            foreach (var message in orderedHistory)
            {
                int msgTokens = EstimateTokens(message.Content) + 4; // overhead for role and delimiters
                if (accumulatedTokens + msgTokens > effectiveHistoryBudget && selectedMessages.Count > 0)
                {
                    break;
                }
                selectedMessages.Add(message);
                accumulatedTokens += msgTokens;
            }

            selectedMessages.Reverse();

            _logger.LogInformation(
                "Token Context Window: Selected {SelectedCount} of {TotalCount} messages totaling {Tokens} tokens (Budget: {EffectiveBudget}, MaxContext: {MaxTokens}) for ConversationId: {ConversationId}.",
                selectedMessages.Count, history.Count, accumulatedTokens, effectiveHistoryBudget, maxContextTokens, conversation.Id);

            foreach (var message in selectedMessages)
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
            int maxOutputTokens = _configuration.GetValue<int>("AI:MaxOutputTokens", 800);
            var chatOptions = new ChatOptions
            {
                MaxOutputTokens = maxOutputTokens > 0 ? maxOutputTokens : 800,
                Temperature = 0.2f
            };
            if (tools.Count > 0)
            {
                var relevantTools = FilterRelevantTools(tools, request.Message);
                chatOptions.Tools = [.. relevantTools];
                _logger.LogInformation("Selected {SelectedCount} of {TotalCount} MCP tools for user request.", relevantTools.Count, tools.Count);
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

            aiMessageText = CleanRepetitiveText(aiMessageText);

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
                Message = aiMessageText,
                PromptTokens = (int?)response.Usage?.InputTokenCount,
                CompletionTokens = (int?)response.Usage?.OutputTokenCount,
                TotalTokens = (int?)response.Usage?.TotalTokenCount,
                ContextTokens = accumulatedTokens,
                MaxContextTokens = maxContextTokens
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to complete AI response generation for ConversationId: {ConversationId}", conversation.Id);

            // Save user-friendly failure message as assistant turn to preserve conversational parity and prevent orphaned user messages
            var errorAssistantMessage = new Domain.Entities.ChatMessage
            {
                Id = Guid.NewGuid(),
                ConversationId = conversation.Id,
                Role = "assistant",
                Content = "တောင်းပန်ပါသည်။ စနစ်ချို့ယွင်းချက်ကြောင့် AI အဖြေမထုတ်ပေးနိုင်ပါ။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားပေးပါ (An error occurred while generating AI response. Please try again).",
                CreatedAt = DateTime.UtcNow
            };
            await _messageRepository.AddAsync(errorAssistantMessage);

            conversation.UpdatedAt = DateTime.UtcNow;
            await _conversationRepository.UpdateAsync(conversation);

            throw;
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

        int maxContextTokens = _configuration.GetValue<int>("AI:MaxContextTokens", 4000);
        if (maxContextTokens <= 0) maxContextTokens = 4000;

        int totalTokens = 0;
        var messageModels = messages.OrderBy(x => x.CreatedAt).Select(x =>
        {
            int tokens = EstimateTokens(x.Content) + 4;
            totalTokens += tokens;
            return new ChatHistoryMessageModel
            {
                Role = x.Role,
                Content = x.Content,
                CreatedAt = x.CreatedAt,
                EstimatedTokens = tokens
            };
        }).ToList();

        // Calculate active context tokens (taking from latest backwards up to effective context budget)
        int contextTokens = 0;
        const int safetyReserveTokens = 600;
        int effectiveHistoryBudget = Math.Max(500, maxContextTokens - safetyReserveTokens);
        for (int i = messageModels.Count - 1; i >= 0; i--)
        {
            if (contextTokens + messageModels[i].EstimatedTokens > effectiveHistoryBudget && contextTokens > 0)
                break;
            contextTokens += messageModels[i].EstimatedTokens;
        }

        return new ChatHistoryResponseModel
        {
            ConversationId = conversation.Id,
            Title = conversation.Title ?? string.Empty,
            Messages = messageModels,
            TotalEstimatedTokens = totalTokens,
            ContextTokens = contextTokens,
            MaxContextTokens = maxContextTokens
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

    public static int EstimateTokens(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0;
        int asciiChars = 0;
        int nonAsciiChars = 0;
        foreach (char c in text)
        {
            if (c <= 127) asciiChars++;
            else nonAsciiChars++;
        }
        // English/ASCII averages ~3.5 chars per token.
        // Non-ASCII (Burmese Unicode U+1000..U+109F, CJK, etc.) averages ~1.2 tokens per character in modern BPE tokenizers.
        int estimated = (int)Math.Ceiling(asciiChars / 3.5) + (int)Math.Ceiling(nonAsciiChars * 1.2);
        return Math.Max(1, estimated);
    }

    /// <summary>
    /// Removes repetitive word/phrase loops that smaller free LLMs sometimes produce in Myanmar text
    /// (e.g. "ပြီး ချက်ခြင်း ပြီး ချက်ခြင်း ပြီး ချက်ခြင်း...").
    /// </summary>
    private static string CleanRepetitiveText(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        // Collapse any 1-to-5 word phrase repeated 3 or more times consecutively
        var cleaned = System.Text.RegularExpressions.Regex.Replace(
            text,
            @"(\S+(?:\s+\S+){0,4}\s*)\1{2,}",
            "$1");

        // Also collapse any character/syllable sequence (3+ chars) repeated 3 or more times consecutively
        cleaned = System.Text.RegularExpressions.Regex.Replace(
            cleaned,
            @"(.{3,30}?)\1{2,}",
            "$1");

        return cleaned.Trim();
    }

    /// <summary>
    /// Dynamically selects and prioritizes MCP tools based on user prompt intent.
    /// Completely dynamic: Uses Tool Name and Description metadata scoring.
    /// Adding new tools/features requires ZERO code changes to this method.
    /// </summary>
    private static IList<AITool> FilterRelevantTools(IList<AITool> allTools, string userPrompt)
    {
        // 1. If tools are 20 or fewer, modern LLMs easily handle them in full without context pollution
        if (allTools.Count <= 20)
        {
            return allTools;
        }

        // 2. Tokenize user prompt into meaningful keywords
        var promptWords = userPrompt.ToLowerInvariant()
            .Split(new[] { ' ', ',', '.', '?', '!', ':', ';', '\n', '\r', '\t' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(w => w.Length >= 2)
            .ToHashSet();

        if (promptWords.Count == 0)
        {
            return allTools;
        }

        // 3. Dynamically score each tool based on its Name and Description metadata
        var scoredTools = allTools.Select(tool =>
        {
            var toolName = tool is AIFunction fn ? fn.Name : tool.ToString() ?? string.Empty;
            var toolDesc = tool is AIFunction fnd ? fnd.Description : string.Empty;

            var nameLower = toolName.ToLowerInvariant();
            var descLower = toolDesc.ToLowerInvariant();

            int matchScore = 0;

            foreach (var word in promptWords)
            {
                // Exact or partial match in Tool Name gives high weight
                if (nameLower.Contains(word))
                {
                    matchScore += 5;
                }

                // Match in Tool Description gives medium weight
                if (descLower.Contains(word))
                {
                    matchScore += 2;
                }
            }

            return new { Tool = tool, Score = matchScore };
        })
        .OrderByDescending(x => x.Score)
        .ToList();

        // 4. Select tools that have relevance score > 0 (up to Top 10)
        var relevant = scoredTools
            .Where(x => x.Score > 0)
            .Select(x => x.Tool)
            .Take(10)
            .ToList();

        // Fallback: If no tool scored (e.g. greeting or ambiguous prompt), return all tools
        return relevant.Count > 0 ? relevant : allTools;
    }
}
