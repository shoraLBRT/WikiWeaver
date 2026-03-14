using System.Text.Json.Serialization;

namespace WikiWeaver.Infrastructure.Data;

internal sealed class DemoSeedData
{
    public List<string> Roots { get; init; } = new();
    [JsonPropertyName("nodes")]
    public List<DemoSectionSeed> Sections { get; init; } = new();
    public List<DemoArticleContentSeed> Articles { get; init; } = new();
}

internal sealed class DemoSectionSeed
{
    public string Title { get; init; } = string.Empty;
    public string ParentTitle { get; init; } = string.Empty;
}

internal sealed class DemoArticleContentSeed
{
    [JsonPropertyName("nodeTitle")]
    public string NavigationTitle { get; init; } = string.Empty;

    public string Title { get; init; } = string.Empty;
    public List<string> Paragraphs { get; init; } = new();
}
