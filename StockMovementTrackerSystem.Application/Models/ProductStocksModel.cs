namespace StockMovementTrackerSystem.Application.Models
{
    public class ProductStocksModel
    {
        public string ProductId { get; set; } = null!;

        public string? ProductName { get; set; }

        public int? CurrentStock { get; set; }

        public int? TotalTransactionsCount { get; set; }

        public DateTime? CreatedDate { get; set; }

        public DateTime? LastUpdatedDate { get; set; }
    }
}
