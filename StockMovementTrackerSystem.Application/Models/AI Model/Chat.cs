using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace StockMovementTrackerSystem.Application.Models.AI_Model
{
    public sealed class ChatRequest
    {
        [Required]
        [StringLength(4000, MinimumLength = 1)]
        public string Message { get; set; } = string.Empty;
    }
    public sealed class ChatResponse
    {
        public string Answer { get; set; } = string.Empty;
    }

}
