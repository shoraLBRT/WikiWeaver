namespace WikiWeaver.Domain.Entities;

public class AiProviderSettings
{
    public int Id { get; set; }
    public string BaseUrl { get; set; } = "https://api.openai.com/v1";
    public string Model { get; set; } = "gpt-4o-mini";
    public string? ApiKey { get; set; }
    public bool IsEnabled { get; set; }
}
