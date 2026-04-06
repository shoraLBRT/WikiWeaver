using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.Application.Tests;

internal static class TestDbHelper
{
    public static WikiWeaverDbContext CreateInMemoryContext()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<WikiWeaverDbContext>()
            .UseSqlite(connection)
            .Options;

        var context = new WikiWeaverDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}
