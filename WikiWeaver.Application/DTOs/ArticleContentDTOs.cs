namespace WikiWeaver.Application.DTOs
{
    public record ArticleContentCreateDto(
        string Title,
        int? NodeId,
        List<ParagraphDto> Paragraphs
    );

    public record ArticleContentDto(
        int Id,
        string Title,
        List<ParagraphDto> Paragraphs
    );
}
