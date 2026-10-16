using System;
using System.Collections.Generic;

namespace StockMovementTrackerSystem.Application.Models.Chat;

public class ChatRequestModel
{
    public Guid? ConversationId { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ChatResponseModel
{
    public Guid ConversationId { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? PromptTokens { get; set; }
    public int? CompletionTokens { get; set; }
    public int? TotalTokens { get; set; }
    public int ContextTokens { get; set; }
    public int MaxContextTokens { get; set; }
}

public class ChatHistoryResponseModel
{
    public Guid ConversationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<ChatHistoryMessageModel> Messages { get; set; } = [];
    public int TotalEstimatedTokens { get; set; }
    public int ContextTokens { get; set; }
    public int MaxContextTokens { get; set; }
}

public class ChatHistoryMessageModel
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int EstimatedTokens { get; set; }
}

public class ChatConversationListResponseModel
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
