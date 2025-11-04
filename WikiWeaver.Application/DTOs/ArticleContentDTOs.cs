namespace WikiWeaver.Application.DTOs
{
    public record ArticleContentDto(
        int Id,
        string Title,
        List<ParagraphDto> Paragraphs
    );
}
