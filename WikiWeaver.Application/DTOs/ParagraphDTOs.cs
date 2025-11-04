namespace WikiWeaver.Application.DTOs
{
    public class ParagraphReadDto
    {
        public int Id { get; set; }
        public string Content { get; set; }
        public int ArticleId { get; set; }
    }

    public class ParagraphCreateDto
    {
        public string Content { get; set; }
        public int ArticleId { get; set; }
    }
}
