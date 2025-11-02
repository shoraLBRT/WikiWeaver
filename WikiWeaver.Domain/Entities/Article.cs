namespace WikiWeaver.Domain.Entities
{
    public class Article
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public Node? Node { get; set; }
        public int? NodeId { get; set; }
        public ICollection<Paragraph> Paragraphs { get; set; } = new List<Paragraph>();
    }
}
