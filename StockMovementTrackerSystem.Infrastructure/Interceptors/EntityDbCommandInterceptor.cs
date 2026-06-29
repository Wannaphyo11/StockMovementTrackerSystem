using System.Data.Common;
using System.Text;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace StockMovementTrackerSystem.Infrastructure.Interceptors
{
    public class EntityDbCommandInterceptor : DbCommandInterceptor
    {
        public override InterceptionResult<DbDataReader> ReaderExecuting(
        DbCommand command,
        CommandEventData eventData,
        InterceptionResult<DbDataReader> result)
        {
            ManipulateCommand(command);

            return result;
        }

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            ManipulateCommand(command);

            return new ValueTask<InterceptionResult<DbDataReader>>(result);
        }

        private static void ManipulateCommand(DbCommand command)
        {
            StringBuilder builder = new();
            _ = builder.AppendLine();
            _ = builder.AppendLine("------------> Entity Framework Command Text <------------");
            _ = builder.AppendLine();
            _ = builder.Append(command.CommandText);
            _ = builder.AppendLine();
            _ = builder.AppendLine();
            _ = builder.AppendLine("-----------------------------------------------------------------------------------\n");
            command.CommandText = builder.ToString();
        }
    }
}
