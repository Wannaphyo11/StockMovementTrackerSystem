using System;

namespace StockMovementTrackerSystem.McpServer.Attributes;

/// <summary>
/// Specifies the functional category and operation type (Query/Command) of an MCP tool.
/// Useful for routing, dynamic filtering, security permissions, and documentation.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, Inherited = false, AllowMultiple = false)]
public sealed class McpCategoryAttribute : Attribute
{
    public string Category { get; }
    public bool IsMutation { get; }

    public McpCategoryAttribute(string category, bool isMutation = false)
    {
        Category = category;
        IsMutation = isMutation;
    }
}
