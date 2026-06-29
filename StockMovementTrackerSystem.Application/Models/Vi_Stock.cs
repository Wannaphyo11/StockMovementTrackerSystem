using System;
using System.Collections.Generic;
using System.Text;

namespace StockMovementTrackerSystem.Application.Models
{
    public class Vi_Stock
    {
        public string ProductId { get; set; } = null!;

        public string? ProductName { get; set; }

        public int? CurrentStock { get; set; }

        public int? TotalTransactionsCount { get; set; }

        public DateTime? MovementDate { get; set; }
    }
}
