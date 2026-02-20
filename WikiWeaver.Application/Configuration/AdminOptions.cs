namespace WikiWeaver.Application.Configuration;

public sealed class AdminOptions
{
    public const string SectionName = "Admin";

    public AdminAiOptions Ai { get; set; } = new();
}

public sealed class AdminAiOptions
{
    public string MarkdownStylingSystemPrompt { get; set; } = string.Empty;

    public double Temperature { get; set; } = 0.1;
}
