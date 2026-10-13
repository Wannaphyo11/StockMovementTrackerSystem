using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using StockMovementTrackerSystem.Domain.Entities;

namespace StockMovementTrackerSystem.Application.Interfaces.Repositories;

public interface IChatConversationRepository
{
    Task<ChatConversation> CreateAsync(string userId, string? title = null);
    Task<ChatConversation?> GetByIdAsync(Guid conversationId, string userId);
    Task<List<ChatConversation>> GetByUserIdAsync(string userId);
    Task UpdateAsync(ChatConversation conversation);
    Task<bool> DeleteAsync(Guid conversationId, string userId);
}
