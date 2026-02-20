using Microsoft.EntityFrameworkCore;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.MinimalApi.Endpoints;

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("/admin").WithTags("Admin");

        group.MapPost("/cleanup", async (WikiWeaverDbContext dbContext, ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("AdminCleanup");

            var nodeCount = await dbContext.Nodes.CountAsync();
            var articleCount = await dbContext.Articles.CountAsync();
            var paragraphCount = await dbContext.Paragraphs.CountAsync();

            await using var transaction = await dbContext.Database.BeginTransactionAsync();

            if (dbContext.Database.IsSqlite())
            {
                // Some local databases may contain older schema variations where Nodes.ArticleId
                // is enforced as a foreign key to Articles. Nullify optional references first,
                // then remove dependent rows in a stable order.
                await dbContext.Database.ExecuteSqlRawAsync(
                    "UPDATE \"Nodes\" SET \"ParentId\" = NULL, \"ArticleId\" = NULL WHERE \"ParentId\" IS NOT NULL OR \"ArticleId\" IS NOT NULL;");
                await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM \"Paragraphs\";");
                await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM \"Articles\";");
                await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM \"Nodes\";");
                await dbContext.Database.ExecuteSqlRawAsync(
                    "DELETE FROM sqlite_sequence WHERE name IN ('Paragraphs', 'Articles', 'Nodes');");
            }
            else
            {
                await dbContext.Database.ExecuteSqlRawAsync(
                    "TRUNCATE TABLE \"Paragraphs\", \"Articles\", \"Nodes\" RESTART IDENTITY CASCADE;");
            }

            await transaction.CommitAsync();

            logger.LogWarning(
                "Public admin cleanup executed. Deleted Nodes: {NodeCount}, Articles: {ArticleCount}, Paragraphs: {ParagraphCount}",
                nodeCount,
                articleCount,
                paragraphCount);

            return Results.Ok(new
            {
                deletedNodes = nodeCount,
                deletedArticles = articleCount,
                deletedParagraphs = paragraphCount,
                message = "Cleanup completed"
            });
        });

        return builder;
    }
}
