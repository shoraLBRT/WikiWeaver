using System.Reflection;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WikiWeaver.Domain.Entities;

namespace WikiWeaver.Infrastructure.Data;

/// <summary>
/// Demonstration-only database seed for showcasing WikiWeaver navigation and article content.
/// This data is not intended for production usage.
/// </summary>
public static class DemoDataSeeder
{
    private const string DemoSeedFileName = "philosophy-demo-seed.json";

    public static async Task SeedAsync(WikiWeaverDbContext dbContext, CancellationToken cancellationToken = default)
    {
        await dbContext.Database.MigrateAsync(cancellationToken);

        if (await dbContext.Nodes.AnyAsync(cancellationToken) || await dbContext.Articles.AnyAsync(cancellationToken))
            return;

        var seedData = await LoadSeedDataAsync(cancellationToken);

        var roots = seedData.Roots
            .Select(title => new Node { Title = title })
            .ToList();

        dbContext.Nodes.AddRange(roots);
        await dbContext.SaveChangesAsync(cancellationToken);

        var nodeByTitle = roots.ToDictionary(n => n.Title);

        var childNodes = new List<Node>();
        foreach (var seedNode in seedData.Nodes)
        {
            if (!nodeByTitle.TryGetValue(seedNode.ParentTitle, out var parentNode))
                continue;

            var childNode = new Node
            {
                Title = seedNode.Title,
                ParentId = parentNode.Id
            };

            childNodes.Add(childNode);
            nodeByTitle[childNode.Title] = childNode;
        }

        dbContext.Nodes.AddRange(childNodes);
        await dbContext.SaveChangesAsync(cancellationToken);

        foreach (var seedArticle in seedData.Articles)
        {
            if (!nodeByTitle.TryGetValue(seedArticle.NodeTitle, out var node))
                continue;

            var article = new Article
            {
                Title = seedArticle.Title,
                NodeId = node.Id,
                Paragraphs = seedArticle.Paragraphs
                    .Select((content, index) => new Paragraph
                    {
                        Content = content,
                        Order = index + 1,
                        IsDefault = true
                    })
                    .ToList()
            };

            dbContext.Articles.Add(article);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task<DemoSeedData> LoadSeedDataAsync(CancellationToken cancellationToken)
    {
        var assembly = typeof(DemoDataSeeder).Assembly;
        var resourceName = assembly
            .GetManifestResourceNames()
            .FirstOrDefault(name => name.EndsWith(DemoSeedFileName, StringComparison.OrdinalIgnoreCase));

        if (resourceName is null)
            throw new InvalidOperationException($"Embedded demo seed file '{DemoSeedFileName}' was not found.");

        await using var stream = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Unable to open embedded resource stream for '{resourceName}'.");

        var seedData = await JsonSerializer.DeserializeAsync<DemoSeedData>(
            stream,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true },
            cancellationToken);

        return seedData ?? throw new InvalidOperationException("Demo seed file is empty or invalid.");
    }

    private sealed class DemoSeedData
    {
        public List<string> Roots { get; init; } = new();
        public List<DemoNodeSeed> Nodes { get; init; } = new();
        public List<DemoArticleSeed> Articles { get; init; } = new();
    }

    private sealed class DemoNodeSeed
    {
        public string Title { get; init; } = string.Empty;
        public string ParentTitle { get; init; } = string.Empty;
    }

    private sealed class DemoArticleSeed
    {
        public string NodeTitle { get; init; } = string.Empty;
        public string Title { get; init; } = string.Empty;
        public List<string> Paragraphs { get; init; } = new();
    }
}
