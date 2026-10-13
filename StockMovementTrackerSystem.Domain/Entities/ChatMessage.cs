using System;
using System.Collections.Generic;

namespace StockMovementTrackerSystem.Domain.Entities;

public partial class ChatMessage
{
    public Guid Id { get; set; }

    public Guid ConversationId { get; set; }

    public string Role { get; set; } = null!;

    public string Content { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual ChatConversation Conversation { get; set; } = null!;
}
