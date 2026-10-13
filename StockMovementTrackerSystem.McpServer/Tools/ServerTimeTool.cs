using ModelContextProtocol.Server;
using System.ComponentModel;

namespace StockMovementTrackerSystem.McpServer.Tools;

[McpServerToolType]
public class ServerTimeTool
{
    [McpServerTool]
    [Description("Get the current server date and time")]
    public string GetServerTime()
    {
        return DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
    }
}