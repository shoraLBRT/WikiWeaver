namespace WikiWeaver.Application.DTOs
{
    public record ArticleContentCreateDto(
        string Title,
        int? ParentArticleId,
        List<ParagraphDto> Paragraphs
    );

    public record ArticleContentDto(
        int Id,
        string Title,
        List<ParagraphDto> Paragraphs
    );
}
