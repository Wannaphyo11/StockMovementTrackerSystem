using StockMovementTrackerSystem.Application.Interfaces;

namespace StockMovementTrackerSystem.Api.Middlewares;

public class EncryptionMiddleware(RequestDelegate next)
{
    public async Task Invoke(HttpContext context)
    {
        string? referer = context.Request.Headers.Referer;
        string requestPath = context.Request.Path.Value ?? string.Empty;
        bool isExactExcludedUrl = GLOBAL.GetEncryptionExcludeUrLs().Contains(requestPath);
        bool isPrefixExcludedUrl = GLOBAL.GetEncryptionExcludeUrLs().Any(requestPath.StartsWith);
        bool isOptionsMethod = context.Request.Method == "OPTIONS";
        bool hasPostmanToken = !string.IsNullOrEmpty(context.Request.Headers["Postman-Token"]);
        bool hasMobileRequest = !string.IsNullOrEmpty(context.Request.Headers["Mobile-Request"]);
        bool isScalarMode = referer?.Contains("/docs/scalar") ?? false;

        bool shouldDecrypt = !isExactExcludedUrl &&
                             !isPrefixExcludedUrl &&
                             !isOptionsMethod &&
                             !hasPostmanToken &&
                             !hasMobileRequest &&
                             !isScalarMode;

        if (shouldDecrypt)
        {
            IEncryptionService encryptionService = context.RequestServices.GetRequiredService<IEncryptionService>();
            context.Request.EnableBuffering();
            context.Request.Body = encryptionService.DecryptStream(context.Request.Body);
            if (context.Request.QueryString.HasValue)
            {
                string decryptedString = encryptionService.DecryptString(context.Request.QueryString.Value[1..]);
                context.Request.QueryString = new QueryString($"?{decryptedString}");
            }
        }
        await next(context);
    }
}
