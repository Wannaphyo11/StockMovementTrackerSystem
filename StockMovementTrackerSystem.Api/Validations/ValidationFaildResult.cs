using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace StockMovementTrackerSystem.Api.Validations
{
    public class ValidationFailedResult : ObjectResult
    {
        public ValidationFailedResult(ModelStateDictionary modelState)
            : base(new ValidationModel(modelState))
        {
            StatusCode = StatusCodes.Status422UnprocessableEntity; //change the http status code to 422.
        }
    }

    internal class ValidationModel(ModelStateDictionary modelState) : ValidationBase
    {
        public bool Success { get; set; } = false;
        public int Code { get; set; } = StatusCodes.Status422UnprocessableEntity;
        public dynamic Message { get; set; } = $"Fields Required [" +
            string.Join(",", modelState.Keys
#pragma warning disable CS8602 // Dereference of a possibly null reference.
                    .SelectMany(key => modelState[key].Errors.Select(x => new ValidationError(key, x.ErrorMessage)))
#pragma warning restore CS8602 // Dereference of a possibly null reference.
                    .ToList().Select(x => x.Field).ToList()) +
            $"]";
        public dynamic Data { get; set; } = modelState.Keys
#pragma warning disable CS8602 // Dereference of a possibly null reference.
                    .SelectMany(key => modelState[key].Errors.Select(x => new ValidationError(key, x.ErrorMessage)))
#pragma warning restore CS8602 // Dereference of a possibly null reference.
                    .ToList();
    }
}
