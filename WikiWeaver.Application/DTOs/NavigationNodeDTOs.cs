namespace WikiWeaver.Application.DTOs
{
    public class NavigationNodeDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public int? ParentId { get; set; }
        public List<NavigationNodeDto>? Children { get; set; }
        public ArticleReadDto? Article { get; set; }
    }

}
