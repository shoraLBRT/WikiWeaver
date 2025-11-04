namespace WikiWeaver.Application.DTOs
{
    public class NodeDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public int? ParentId { get; set; }
        public List<int> ChildrenIds { get; set; } = new();
        public List<NodeDto>? Children { get; set; } = new();
    }

    public class CreateNodeDto
    {
        public string Title { get; set; }
        public int? ParentId { get; set; }
    }
}
