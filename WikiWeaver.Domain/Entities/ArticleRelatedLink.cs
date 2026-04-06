namespace WikiWeaver.Domain.Entities
{
    public class ArticleRelatedLink
    {
        public int Id { get; set; }
        public int ArticleId { get; set; }
        public Article Article { get; set; } = null!;
        public int RelatedArticleId { get; set; }
        public Article RelatedArticle { get; set; } = null!;
        public int Order { get; set; }
    }
}
