namespace WikiWeaver.Application.DTOs
{
    public record ArticleInfoboxFieldCreateDto(
        int Order,
        string Key,
        string Label,
        string Value
    );

    public record ArticleInfoboxCreateDto(
        string? Title,
        string? Subtitle,
        List<ArticleInfoboxFieldCreateDto> Fields
    );

    public record ArticleInfoboxFieldDto(
        int Id,
        int Order,
        string Key,
        string Label,
        string Value
    );

    public record ArticleInfoboxDto(
        string? Title,
        string? Subtitle,
        List<ArticleInfoboxFieldDto> Fields
    );

    public record ArticleRelatedLinkCreateDto(
        int RelatedArticleId,
        int Order
    );

    public record ArticleRelatedLinkDto(
        int Id,
        int RelatedArticleId,
        string RelatedArticleTitle,
        int Order
    );

    public record ArticleContentCreateDto(
        string Title,
        int? ParentArticleId,
        List<ParagraphDto> Paragraphs,
        ArticleInfoboxCreateDto? Infobox,
        string? Summary,
        List<string>? Tags,
        List<ArticleRelatedLinkCreateDto>? RelatedLinks
    );

    public record ArticleContentDto(
        int Id,
        string Title,
        List<ParagraphDto> Paragraphs,
        ArticleInfoboxDto? Infobox,
        string? Summary,
        List<string> Tags,
        List<ArticleRelatedLinkDto>? RelatedLinks
    );
}
