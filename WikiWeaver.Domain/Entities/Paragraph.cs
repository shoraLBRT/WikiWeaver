namespace WikiWeaver.Domain.Entities;

public class Paragraph
{
    public int Id { get; set; }
    public int ArticleId { get; set; }
    public Article Article { get; set; } = null!;
    public int Order { get; set; } // порядок вывода в статье
    public string Content { get; set; } = string.Empty;
    public bool IsDefault { get; set; } = false; // альтернативные блоки имеют false
}
