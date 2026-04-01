namespace WikiWeaver.Application.DTOs
{
    public class AdminCleanupResultDto
    {
        public int DeletedArticles { get; set; }
        public int DeletedParagraphs { get; set; }
        public string Message { get; set; }
    }

    public class AiProviderSettingsDto
    {
        public string BaseUrl { get; set; }
        public string Model { get; set; }
        public bool IsEnabled { get; set; }
        public bool HasApiKey { get; set; }
        public string? MarkdownStylingSystemPrompt { get; set; }
    }

    public class UpdateAiProviderSettingsDto
    {
        public string BaseUrl { get; set; }
        public string Model { get; set; }
        public bool IsEnabled { get; set; }
        public string? ApiKey { get; set; }
        public string? MarkdownStylingSystemPrompt { get; set; }
    }

    public class AiStyleRequestDto
    {
        public string Text { get; set; }
    }

    public class AiStyleResponseDto
    {
        public string StyledText { get; set; }
    }

    public class AiConnectionCheckResultDto
    {
        public string Message { get; set; }
        public string StyledText { get; set; }
    }
}
