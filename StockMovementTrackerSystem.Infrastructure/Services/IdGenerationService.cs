
using StockMovementTrackerSystem.Application.Interfaces;
using System.Text;

namespace StockMovementTrackerSystem.Infrastructure.Services;

public class IdGenerationService(
      IRandomizer randomizer) : IIdGenerationService
{
    public string GetJounerId()
    {
        StringBuilder stringBuilder = new();
        _ = stringBuilder.Append(randomizer.RandomAlphanumeric(6, $"JMV", "ddMMyy"));
        return stringBuilder.ToString();
    }
}