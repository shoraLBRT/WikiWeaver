namespace WikiWeaver.Application.DTOs
{
    public record ParagraphDto(int Id, string Content, int Order);

    public class ParagraphReadDto
    {
        public int Id { get; set; }
        public string Content { get; set; }
        public int ArticleId { get; set; }
        public int Order { get; set; }
        public bool IsDefault { get; set; }
    }

    public class ParagraphCreateDto
    {
        public string Content { get; set; }
        public int ArticleId { get; set; }
        public int Order { get; set; }
    }
}
