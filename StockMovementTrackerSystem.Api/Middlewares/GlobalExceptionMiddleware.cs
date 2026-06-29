using Newtonsoft.Json;
using System.Net;

namespace StockMovementTrackerSystem.Api.Middlewares;

public class GlobalExceptionMiddleware(RequestDelegate next, ILogger<EncryptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError("Runtime Error : {message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    public static Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        var model = new
        {
            success = false,
            code = StatusCodes.Status500InternalServerError,
            data = "",
            message = ex.Message
        };
        return context.Response.WriteAsync(JsonConvert.SerializeObject(model));
    }
}
