using Microsoft.EntityFrameworkCore.Diagnostics;

namespace StockMovementTrackerSystem.Infrastructure.Interceptors
{
    public class DbSaveChangesInterceptor : SaveChangesInterceptor
    {
        public override ValueTask<int> SavedChangesAsync(
            SaveChangesCompletedEventData eventData,
            int result,
            CancellationToken cancellationToken = default)
        {
            Console.WriteLine($"Entities Saved: {result}");
            return base.SavedChangesAsync(eventData, result, cancellationToken);
        }

        public override int SavedChanges(SaveChangesCompletedEventData eventData, int result)
        {
            Console.WriteLine($"Entities Saved: {result}");
            return base.SavedChanges(eventData, result);
        }
    }
}
