using System;
using System.Collections.Generic;
using System.Text;

namespace StockMovementTrackerSystem.Application.Models
{
    public class ViProductStockModel
    {
        public string MovementId { get; set; } = null!;

        public string ProductId { get; set; } = null!;

        public string? ProductName { get; set; }

        public int? CurrentStock { get; set; }

        public int? Quantity { get; set; }

        public string? Type { get; set; }

        public int? TotalTransactionsCount { get; set; }

        public DateTime? MovementDate { get; set; }
    }
}
