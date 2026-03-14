using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using WikiWeaver.Domain.Entities;

namespace WikiWeaver.Infrastructure.Data;

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

        var articleByTitle = await SeedNavigationArticlesAsync(dbContext, seedData, cancellationToken);
        await SeedArticlesWithContentAsync(dbContext, seedData, articleByTitle, cancellationToken);
    }

    private static async Task<bool> HasAnyContentAsync(WikiWeaverDbContext dbContext, CancellationToken cancellationToken)
        => await dbContext.Articles.AnyAsync(cancellationToken);

    private static async Task<Dictionary<string, Article>> SeedNavigationArticlesAsync(
        WikiWeaverDbContext dbContext,
        DemoSeedData seedData,
        CancellationToken cancellationToken)
    {
        var articleByTitle = new Dictionary<string, Article>(StringComparer.Ordinal);

        AddRootArticles(dbContext, seedData.Roots, articleByTitle);

        var pendingSections = new List<DemoSectionSeed>(seedData.Sections);
        while (pendingSections.Count > 0)
        {
            var insertedInPass = 0;

            for (var index = pendingSections.Count - 1; index >= 0; index--)
                insertedInPass += TryInsertSectionArticle(dbContext, pendingSections, index, articleByTitle);

            if (insertedInPass == 0)
                throw BuildUnresolvedSectionsException(pendingSections);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return articleByTitle;
    }

    private static async Task SeedArticlesWithContentAsync(
        WikiWeaverDbContext dbContext,
        DemoSeedData seedData,
        IReadOnlyDictionary<string, Article> articleByTitle,
        CancellationToken cancellationToken)
    {
        foreach (var articleSeed in seedData.Articles)
        {
            if (!articleByTitle.TryGetValue(articleSeed.NavigationTitle, out var article))
            {
                throw new InvalidOperationException(
                    $"Demo seed article '{articleSeed.Title}' references unknown title '{articleSeed.NavigationTitle}'.");
            }

            article.Title = articleSeed.Title;
            article.Paragraphs = BuildParagraphs(articleSeed.Paragraphs).ToList();
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static InvalidOperationException BuildUnresolvedSectionsException(IEnumerable<DemoSectionSeed> unresolvedSections)
    {
        var unresolvedTitles = string.Join(", ", unresolvedSections.Select(section => $"'{section.Title}' (parent: '{section.ParentTitle}')"));
        return new InvalidOperationException(
            $"Demo seed contains sections with missing parents or cyclic dependencies: {unresolvedTitles}");
    }

    private static IEnumerable<Paragraph> BuildParagraphs(IEnumerable<string> rawParagraphs)
    {
        var currentOrder = 0;

        foreach (var rawParagraph in rawParagraphs)
        {
            var isAlternative = IsAlternativeParagraph(rawParagraph);
            var content = NormalizeParagraph(rawParagraph, isAlternative);

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
        EnsureNoDuplicates(seedData.Sections.Select(section => section.Title), "Demo seed contains duplicate section titles: {0}");

        var allTitles = new HashSet<string>(seedData.Roots, StringComparer.Ordinal);
        foreach (var sectionTitle in seedData.Sections.Select(section => section.Title))
        {
            if (!allTitles.Add(sectionTitle))
                throw new InvalidOperationException($"Demo seed title is duplicated between roots/sections: '{sectionTitle}'.");
        }

        EnsureNoDuplicates(
            seedData.Articles.Select(article => article.NavigationTitle),
            "Demo seed contains multiple articles for the same navigation title: {0}");
    }

    private static void ValidateArticles(IEnumerable<DemoArticleContentSeed> articles)
    {
        foreach (var article in articles)
        {
            ValidateParagraphs(article);
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

    private static void AddRootArticles(
        WikiWeaverDbContext dbContext,
        IEnumerable<string> rootTitles,
        IDictionary<string, Article> articleByTitle)
    {
        foreach (var rootTitle in rootTitles)
        {
            var rootArticle = new Article { Title = rootTitle };
            dbContext.Articles.Add(rootArticle);
            articleByTitle[rootTitle] = rootArticle;
        }
    }

    private static int TryInsertSectionArticle(
        WikiWeaverDbContext dbContext,
        IList<DemoSectionSeed> pendingSections,
        int index,
        IDictionary<string, Article> articleByTitle)
    {
        var sectionSeed = pendingSections[index];
        if (!articleByTitle.TryGetValue(sectionSeed.ParentTitle, out var parentArticle))
            return 0;

        var childArticle = new Article
        {
            Title = sectionSeed.Title,
            ParentArticle = parentArticle
        };

        dbContext.Articles.Add(childArticle);
        articleByTitle[sectionSeed.Title] = childArticle;
        pendingSections.RemoveAt(index);
        return 1;
    }

    private static void ValidateParagraphs(DemoArticleContentSeed article)
    {
        if (article.Paragraphs.Count == 0)
            throw new InvalidOperationException($"Demo seed article '{article.Title}' must contain at least one paragraph.");

        var defaultParagraphCount = 0;
        foreach (var paragraph in article.Paragraphs)
        {
            var isAlternative = IsAlternativeParagraph(paragraph);
            var normalizedContent = NormalizeParagraph(paragraph, isAlternative);

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

    private static bool IsAlternativeParagraph(string paragraph)
        => paragraph.StartsWith(AlternativeParagraphPrefix, StringComparison.Ordinal);

    private static string NormalizeParagraph(string paragraph, bool isAlternative)
        => isAlternative
            ? paragraph[AlternativeParagraphPrefix.Length..].TrimStart()
            : paragraph;
}
