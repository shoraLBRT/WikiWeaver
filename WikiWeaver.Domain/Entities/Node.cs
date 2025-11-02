namespace WikiWeaver.Domain.Entities;

public class Node
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public Node? Parent { get; set; }
    public ICollection<Node> Children { get; set; } = new List<Node>();
    public int? ArticleId { get; set; }
    public Article? Article { get; set; }
}
