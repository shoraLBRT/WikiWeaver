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
    private const string AlternativeParagraphPrefix = "[ALT]";

    public static async Task SeedAsync(WikiWeaverDbContext dbContext, CancellationToken cancellationToken = default)
    {
        await dbContext.Database.MigrateAsync(cancellationToken);

        if (await HasAnyContentAsync(dbContext, cancellationToken))
            return;

        var seedData = await LoadSeedDataAsync(cancellationToken);
        ValidateSeedData(seedData);

        var nodeByTitle = await SeedNodesAsync(dbContext, seedData, cancellationToken);
        await SeedArticlesAsync(dbContext, seedData, nodeByTitle, cancellationToken);
    }

    private static async Task<bool> HasAnyContentAsync(WikiWeaverDbContext dbContext, CancellationToken cancellationToken)
    {
        return await dbContext.Nodes.AnyAsync(cancellationToken)
            || await dbContext.Articles.AnyAsync(cancellationToken);
    }

    private static async Task<Dictionary<string, Node>> SeedNodesAsync(
        WikiWeaverDbContext dbContext,
        DemoSeedData seedData,
        CancellationToken cancellationToken)
    {
        var nodeByTitle = new Dictionary<string, Node>(StringComparer.Ordinal);

        foreach (var rootTitle in seedData.Roots)
        {
            var rootNode = new Node { Title = rootTitle };
            dbContext.Nodes.Add(rootNode);
            nodeByTitle[rootTitle] = rootNode;
        }

        var pendingNodes = seedData.Nodes.ToList();
        while (pendingNodes.Count > 0)
        {
            var insertedInPass = 0;

            foreach (var nodeSeed in pendingNodes.ToList())
            {
                if (!nodeByTitle.TryGetValue(nodeSeed.ParentTitle, out var parentNode))
                    continue;

                var childNode = new Node
                {
                    Title = nodeSeed.Title,
                    Parent = parentNode
                };

                dbContext.Nodes.Add(childNode);
                nodeByTitle[nodeSeed.Title] = childNode;
                pendingNodes.Remove(nodeSeed);
                insertedInPass++;
            }

            if (insertedInPass == 0)
                throw BuildUnresolvedNodesException(pendingNodes);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return nodeByTitle;
    }

    private static async Task SeedArticlesAsync(
        WikiWeaverDbContext dbContext,
        DemoSeedData seedData,
        IReadOnlyDictionary<string, Node> nodeByTitle,
        CancellationToken cancellationToken)
    {
        foreach (var articleSeed in seedData.Articles)
        {
            if (!nodeByTitle.TryGetValue(articleSeed.NodeTitle, out var node))
            {
                throw new InvalidOperationException(
                    $"Demo seed article '{articleSeed.Title}' references unknown node title '{articleSeed.NodeTitle}'.");
            }

            dbContext.Articles.Add(new Article
            {
                Title = articleSeed.Title,
                NodeId = node.Id,
                Paragraphs = BuildParagraphs(articleSeed.Paragraphs).ToList()
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static InvalidOperationException BuildUnresolvedNodesException(IEnumerable<DemoNodeSeed> unresolvedNodes)
    {
        var unresolvedTitles = string.Join(", ", unresolvedNodes.Select(node => $"'{node.Title}' (parent: '{node.ParentTitle}')"));
        return new InvalidOperationException(
            $"Demo seed contains nodes with missing parents or cyclic dependencies: {unresolvedTitles}");
    }

    private static IEnumerable<Paragraph> BuildParagraphs(IEnumerable<string> rawParagraphs)
    {
        var currentOrder = 0;

        foreach (var rawParagraph in rawParagraphs)
        {
            var isAlternative = rawParagraph.StartsWith(AlternativeParagraphPrefix, StringComparison.Ordinal);
            var content = isAlternative
                ? rawParagraph[AlternativeParagraphPrefix.Length..].TrimStart()
                : rawParagraph;

            if (!isAlternative)
                currentOrder++;

            yield return new Paragraph
            {
                Content = content,
                Order = currentOrder,
                IsDefault = !isAlternative
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
        ValidateDuplicates(seedData);
        ValidateArticles(seedData.Articles);
    }

    private static void ValidateDuplicates(DemoSeedData seedData)
    {
        EnsureNoDuplicates(seedData.Roots, "Demo seed contains duplicate root titles: {0}");
        EnsureNoDuplicates(seedData.Nodes.Select(node => node.Title), "Demo seed contains duplicate node titles: {0}");

        var allTitles = new HashSet<string>(seedData.Roots, StringComparer.Ordinal);
        foreach (var nodeTitle in seedData.Nodes.Select(node => node.Title))
        {
            if (!allTitles.Add(nodeTitle))
                throw new InvalidOperationException($"Demo seed title is duplicated between roots/nodes: '{nodeTitle}'.");
        }

        EnsureNoDuplicates(
            seedData.Articles.Select(article => article.NodeTitle),
            "Demo seed contains multiple articles for the same node title: {0}");
    }

    private static void ValidateArticles(IEnumerable<DemoArticleSeed> articles)
    {
        foreach (var article in articles)
        {
            if (article.Paragraphs.Count == 0)
                throw new InvalidOperationException($"Demo seed article '{article.Title}' must contain at least one paragraph.");

            var defaultParagraphCount = 0;
            foreach (var paragraph in article.Paragraphs)
            {
                var isAlternative = paragraph.StartsWith(AlternativeParagraphPrefix, StringComparison.Ordinal);
                var normalizedContent = isAlternative
                    ? paragraph[AlternativeParagraphPrefix.Length..].TrimStart()
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

    private static void EnsureNoDuplicates(IEnumerable<string> values, string messageTemplate)
    {
        var duplicates = values
            .GroupBy(value => value, StringComparer.Ordinal)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToList();

        if (duplicates.Count > 0)
            throw new InvalidOperationException(string.Format(messageTemplate, string.Join(", ", duplicates)));
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
