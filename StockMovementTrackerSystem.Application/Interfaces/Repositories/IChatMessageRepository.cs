using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using StockMovementTrackerSystem.Domain.Entities;

namespace StockMovementTrackerSystem.Application.Interfaces.Repositories;

public interface IChatMessageRepository
{
    Task<ChatMessage> AddAsync(ChatMessage message);
    Task<List<ChatMessage>> GetByConversationIdAsync(Guid conversationId);
}
