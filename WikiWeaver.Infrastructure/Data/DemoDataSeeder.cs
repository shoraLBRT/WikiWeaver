using Microsoft.EntityFrameworkCore;
using System.Text.Json;
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

        ValidateSeedData(seedData);

        var nodeByTitle = new Dictionary<string, Node>(StringComparer.Ordinal);

        var roots = seedData.Roots
            .Select(title => new Node { Title = title })
            .ToList();

        dbContext.Nodes.AddRange(roots);

        foreach (var root in roots)
            nodeByTitle[root.Title] = root;

        var pendingNodes = seedData.Nodes
            .Select(node => new DemoNodeSeed
            {
                Title = node.Title,
                ParentTitle = node.ParentTitle
            })
            .ToList();

        while (pendingNodes.Count > 0)
        {
            var resolvedInPass = new List<DemoNodeSeed>();

            foreach (var pendingNode in pendingNodes)
            {
                if (!nodeByTitle.TryGetValue(pendingNode.ParentTitle, out var parentNode))
                    continue;

                var childNode = new Node
                {
                    Title = pendingNode.Title,
                    Parent = parentNode
                };

                dbContext.Nodes.Add(childNode);
                nodeByTitle[childNode.Title] = childNode;
                resolvedInPass.Add(pendingNode);
            }

            if (resolvedInPass.Count == 0)
            {
                var unresolvedTitles = string.Join(", ", pendingNodes.Select(node => $"'{node.Title}' (parent: '{node.ParentTitle}')"));
                throw new InvalidOperationException(
                    $"Demo seed contains nodes with missing parents or cyclic dependencies: {unresolvedTitles}");
            }

            foreach (var resolvedNode in resolvedInPass)
                pendingNodes.Remove(resolvedNode);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        foreach (var seedArticle in seedData.Articles)
        {
            if (!nodeByTitle.TryGetValue(seedArticle.NodeTitle, out var node))
            {
                throw new InvalidOperationException(
                    $"Demo seed article '{seedArticle.Title}' references unknown node title '{seedArticle.NodeTitle}'.");
            }

            var article = new Article
            {
                Title = seedArticle.Title,
                NodeId = node.Id,
                Paragraphs = BuildParagraphs(seedArticle.Paragraphs).ToList()
            };

            dbContext.Articles.Add(article);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
    private static IEnumerable<Paragraph> BuildParagraphs(List<string> rawParagraphs)
    {
        var currentOrder = 0;

        foreach (var rawParagraph in rawParagraphs)
        {
            var isAlternative = rawParagraph.StartsWith("[ALT]", StringComparison.Ordinal);
            var content = isAlternative
                ? rawParagraph["[ALT]".Length..].TrimStart()
                : rawParagraph;

            if (isAlternative)
            {
                if (currentOrder == 0)
                    throw new InvalidOperationException("Alternative paragraph cannot be the first paragraph in an article.");

                yield return new Paragraph
                {
                    Content = content,
                    Order = currentOrder,
                    IsDefault = false
                };

                continue;
            }

            currentOrder++;

            yield return new Paragraph
            {
                Content = content,
                Order = currentOrder,
                IsDefault = true
            };
        }
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

    private static void ValidateSeedData(DemoSeedData seedData)
    {
        var duplicateRootTitles = seedData.Roots
            .GroupBy(title => title, StringComparer.Ordinal)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToList();

        if (duplicateRootTitles.Count > 0)
            throw new InvalidOperationException($"Demo seed contains duplicate root titles: {string.Join(", ", duplicateRootTitles)}");

        var duplicateNodeTitles = seedData.Nodes
            .GroupBy(node => node.Title, StringComparer.Ordinal)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToList();

        if (duplicateNodeTitles.Count > 0)
            throw new InvalidOperationException($"Demo seed contains duplicate node titles: {string.Join(", ", duplicateNodeTitles)}");

        var allTitles = new HashSet<string>(seedData.Roots, StringComparer.Ordinal);
        foreach (var nodeTitle in seedData.Nodes.Select(node => node.Title))
        {
            if (!allTitles.Add(nodeTitle))
                throw new InvalidOperationException($"Demo seed title is duplicated between roots/nodes: '{nodeTitle}'.");
        }

        var duplicateArticleNodeReferences = seedData.Articles
            .GroupBy(article => article.NodeTitle, StringComparer.Ordinal)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToList();

        if (duplicateArticleNodeReferences.Count > 0)
        {
            throw new InvalidOperationException(
                $"Demo seed contains multiple articles for the same node title: {string.Join(", ", duplicateArticleNodeReferences)}");
        }

        foreach (var article in seedData.Articles)
        {
            if (article.Paragraphs.Count == 0)
                throw new InvalidOperationException($"Demo seed article '{article.Title}' must contain at least one paragraph.");

            var defaultParagraphCount = 0;
            foreach (var paragraph in article.Paragraphs)
            {
                var isAlternative = paragraph.StartsWith("[ALT]", StringComparison.Ordinal);
                var normalizedContent = isAlternative
                    ? paragraph["[ALT]".Length..].TrimStart()
                    : paragraph;

                if (string.IsNullOrWhiteSpace(normalizedContent))
                {
                    throw new InvalidOperationException(
                        $"Demo seed article '{article.Title}' contains an empty paragraph.");
                }

                if (isAlternative && defaultParagraphCount == 0)
                {
                    throw new InvalidOperationException(
                        $"Demo seed article '{article.Title}' starts with an alternative paragraph before any default paragraph.");
                }

                if (!isAlternative)
                    defaultParagraphCount++;
            }

            if (defaultParagraphCount == 0)
            {
                throw new InvalidOperationException(
                    $"Demo seed article '{article.Title}' must contain at least one default paragraph.");
            }
        }
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
