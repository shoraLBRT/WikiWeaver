namespace WikiWeaver.Infrastructure.Data;

internal sealed class DemoSeedData
{
    public List<string> Roots { get; init; } = new();
    public List<DemoNodeSeed> Nodes { get; init; } = new();
    public List<DemoArticleSeed> Articles { get; init; } = new();
}

internal sealed class DemoNodeSeed
{
    public string Title { get; init; } = string.Empty;
    public string ParentTitle { get; init; } = string.Empty;
}

internal sealed class DemoArticleSeed
{
    public string NodeTitle { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public List<string> Paragraphs { get; init; } = new();
}
