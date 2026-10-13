namespace StockMovementTrackerSystem.Api;

internal class GLOBAL
{
    public static bool IsOriginAllowed(string origin)
    {
        Uri uri = new(origin);
        _ = System.Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "n/a";

        //bool isAllowed = uri.Host.Equals("lab.esoftmm.com", StringComparison.OrdinalIgnoreCase)
        //                 || uri.Host.Equals("lab.esoftmm.com", StringComparison.OrdinalIgnoreCase)
        //                 || uri.Host.Equals("192.168.1.1", StringComparison.OrdinalIgnoreCase)
        //                ;

        bool isAllowed =
    uri.Host.Equals("lab.esoftmm.com", StringComparison.OrdinalIgnoreCase)
    || uri.Host.Equals("192.168.100.23", StringComparison.OrdinalIgnoreCase)
    || uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase);

        //if (!isAllowed && env.Contains("DEV", StringComparison.OrdinalIgnoreCase))
        //    isAllowed = uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase);

        if (!isAllowed)
            isAllowed = uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase);

        return isAllowed;
    }
    public static List<string> GetEncryptionExcludeUrLs()
    {
        List<string> excludeUrl =
        [
            "localhost:7000",
            "/api/master/ecgtests/attachment",
            "/api/master/ultrasoundtests/attachment",
            "/api/master/xraytests/attachment",
            "/api/master/physiotherapies/attachment",
            "/api/master/checkuptypes/attachment",
            "/api/master/doctors/upload-files",
            "/api/master/doctors/uploadsign",
        ];
        return excludeUrl;
    }
        
    public static List<string> GetHttpLoggingExcludeUrLs()
    {
        List<string> excludeUrl =
        [
            "/swagger",
            "/assets/",
        ];
        return excludeUrl;
    }
}
