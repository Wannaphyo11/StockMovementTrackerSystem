namespace StockMovementTrackerSystem.Application.Interfaces;

public interface IIdGenerationService
{
    /// <summary>
    /// JournalVo VNO => [JMV1-010125-RXYDQC]
    /// </summary>
    /// <param name="productId"></param>
    /// <returns></returns>
    string GetJounerId();
}
