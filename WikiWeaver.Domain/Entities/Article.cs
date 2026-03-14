namespace WikiWeaver.Domain.Entities
{
    public class Article
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int? ParentArticleId { get; set; }
        public Article? ParentArticle { get; set; }
        public ICollection<Article> ChildArticles { get; set; } = new List<Article>();
        public ICollection<Paragraph> Paragraphs { get; set; } = new List<Paragraph>();
    }
}
