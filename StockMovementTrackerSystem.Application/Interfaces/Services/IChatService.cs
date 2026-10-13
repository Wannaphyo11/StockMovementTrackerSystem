using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using StockMovementTrackerSystem.Application.Models.Chat;

namespace StockMovementTrackerSystem.Application.Interfaces.Services;

public interface IChatService
{
    Task<ChatResponseModel> SendMessageAsync(ChatRequestModel request);
    Task<ChatHistoryResponseModel> GetConversationAsync(Guid conversationId);
    Task<List<ChatConversationListResponseModel>> GetConversationsAsync();
    Task DeleteConversationAsync(Guid conversationId);
}
