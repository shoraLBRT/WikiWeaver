namespace WikiWeaver.Application.DTOs
{
    public class ArticleReadDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public int? NodeId { get; set; }
    }

    public class ArticleCreateDto
    {
        public string Title { get; set; }
        public int? NodeId { get; set; }
    }
}
