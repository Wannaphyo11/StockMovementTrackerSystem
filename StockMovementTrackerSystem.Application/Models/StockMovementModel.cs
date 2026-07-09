namespace StockMovementTrackerSystem.Application.Models;

public class StockMovementModel
{
    public string MovementId { get; set; } = null!;

    public string ProductId { get; set; } = null!;

    public int Quantity { get; set; }

    public string? Type { get; set; }

    public DateTime? MovementDate { get; set; }

}
