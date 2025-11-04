namespace WikiWeaver.Application.DTOs
{
    public class NodeReadDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public int? ParentId { get; set; }
        public List<int> ChildrenIds { get; set; } = new();
        public List<NodeReadDto>? Children { get; set; } = new();
    }

    public class NodeCreateDto
    {
        public string Title { get; set; }
        public int? ParentId { get; set; }
    }
}
