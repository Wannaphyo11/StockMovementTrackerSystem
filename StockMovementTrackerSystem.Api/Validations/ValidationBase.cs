using System.Text.Json.Serialization;

namespace StockMovementTrackerSystem.Api.Validations
{
    public class ValidationBase
    {
        public List<ValidationError>? Error { get; set; }
    }

    public class ValidationError(string field, string message)
    {
        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Field { get; } = field != string.Empty ? field : null;

        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
        public string? Message { get; } = message;
    }
}