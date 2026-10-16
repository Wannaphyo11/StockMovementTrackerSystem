using ModelContextProtocol.Server;
using StockMovementTrackerSystem.McpServer.Attributes;
using System.ComponentModel;

namespace StockMovementTrackerSystem.McpServer.Tools;

[McpServerToolType]
[McpCategory("System", isMutation: false)]
public class ServerTimeTool
{
    [McpServerTool]
    [Description("Get the current server date and time in UTC and Local time")]
    public string GetServerTime()
    {
        return $"{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC (Server Local: {DateTime.Now:yyyy-MM-dd HH:mm:ss})";
    }
}