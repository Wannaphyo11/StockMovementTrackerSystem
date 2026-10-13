using System;
using System.Collections.Generic;

namespace StockMovementTrackerSystem.Domain.Entities;

public partial class ChatConversation
{
    public Guid Id { get; set; }

    public string UserId { get; set; } = null!;

    public string? Title { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();
}
