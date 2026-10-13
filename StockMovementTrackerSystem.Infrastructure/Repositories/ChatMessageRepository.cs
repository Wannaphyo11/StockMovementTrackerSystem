using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StockMovementTrackerSystem.Application.Interfaces.Repositories;
using StockMovementTrackerSystem.Domain.Entities;
using StockMovementTrackerSystem.Infrastructure.Persistence;

namespace StockMovementTrackerSystem.Infrastructure.Repositories;

public class ChatMessageRepository : IChatMessageRepository
{
    private readonly StockMovementTrackerSystemDbContext _dbContext;

    public ChatMessageRepository(StockMovementTrackerSystemDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ChatMessage> AddAsync(ChatMessage message)
    {
        await _dbContext.ChatMessages.AddAsync(message);
        await _dbContext.SaveChangesAsync();
        return message;
    }

    public async Task<List<ChatMessage>> GetByConversationIdAsync(Guid conversationId)
    {
        return await _dbContext.ChatMessages
            .Where(x => x.ConversationId == conversationId)
            .OrderBy(x => x.CreatedAt)
            .ToListAsync();
    }
}
