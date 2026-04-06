namespace WikiWeaver.Domain.Entities
{
    public class Article
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? InfoboxTitle { get; set; }
        public string? InfoboxSubtitle { get; set; }
        public int? ParentArticleId { get; set; }
        public Article? ParentArticle { get; set; }
        public ICollection<Article> ChildArticles { get; set; } = new List<Article>();
        public ICollection<Paragraph> Paragraphs { get; set; } = new List<Paragraph>();
        public ICollection<ArticleInfoboxField> InfoboxFields { get; set; } = new List<ArticleInfoboxField>();
        public string? Summary { get; set; }
        public string? Tags { get; set; }
        public ICollection<ArticleRelatedLink> RelatedLinks { get; set; } = new List<ArticleRelatedLink>();
    }
}
