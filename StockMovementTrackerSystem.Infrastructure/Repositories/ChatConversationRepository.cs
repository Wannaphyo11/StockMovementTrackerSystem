using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using StockMovementTrackerSystem.Application.Interfaces.Repositories;
using StockMovementTrackerSystem.Domain.Entities;
using StockMovementTrackerSystem.Infrastructure.Persistence;

namespace StockMovementTrackerSystem.Infrastructure.Repositories;

public class ChatConversationRepository : IChatConversationRepository
{
    private readonly StockMovementTrackerSystemDbContext _dbContext;

    public ChatConversationRepository(StockMovementTrackerSystemDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ChatConversation> CreateAsync(string userId, string? title = null)
    {
        var conversation = new ChatConversation
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = title,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _dbContext.ChatConversations.AddAsync(conversation);
        await _dbContext.SaveChangesAsync();
        return conversation;
    }

    public async Task<ChatConversation?> GetByIdAsync(Guid conversationId, string userId)
    {
        return await _dbContext.ChatConversations
            .FirstOrDefaultAsync(x => x.Id == conversationId && x.UserId == userId);
    }

    public async Task<List<ChatConversation>> GetByUserIdAsync(string userId)
    {
        return await _dbContext.ChatConversations
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.UpdatedAt)
            .ToListAsync();
    }

    public async Task UpdateAsync(ChatConversation conversation)
    {
        conversation.UpdatedAt = DateTime.UtcNow;
        _dbContext.ChatConversations.Update(conversation);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<bool> DeleteAsync(Guid conversationId, string userId)
    {
        var conversation = await _dbContext.ChatConversations
            .FirstOrDefaultAsync(x => x.Id == conversationId && x.UserId == userId);
        if (conversation is null)
        {
            return false;
        }

        _dbContext.ChatConversations.Remove(conversation);
        await _dbContext.SaveChangesAsync();
        return true;
    }
}
