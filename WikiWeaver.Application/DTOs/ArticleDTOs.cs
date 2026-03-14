namespace WikiWeaver.Application.DTOs
{
    public class ArticleReadDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public int? ParentArticleId { get; set; }
        public bool HasContent { get; set; }
    }

    public class ArticleCreateDto
    {
        public string Title { get; set; }
        public int? ParentArticleId { get; set; }
    }

    public class ArticleUpdateDto
    {
        public string Title { get; set; }
        public int? ParentArticleId { get; set; }
    }
}
