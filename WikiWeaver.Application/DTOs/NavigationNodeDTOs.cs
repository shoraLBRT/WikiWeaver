namespace WikiWeaver.Application.DTOs
{
    public class NavigationArticleDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int? ParentArticleId { get; set; }
        public bool HasContent { get; set; }
        public List<NavigationArticleDto>? Children { get; set; }
    }
}
