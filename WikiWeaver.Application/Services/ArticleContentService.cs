using WikiWeaver.Application.DTOs;
using WikiWeaver.Application.Exceptions;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Repositories;
using WikiWeaver.Infrastructure.UnitOfWork;

namespace WikiWeaver.Application.Services
{
    public class ArticleContentService
    {
        private readonly ArticleRepository _articleRepo;
        private readonly ParagraphRepository _paragraphRepo;
        private readonly IUnitOfWork _uow;

        public ArticleContentService(
            ArticleRepository articleRepo,
            ParagraphRepository paragraphRepo,
            IUnitOfWork uow)
        {
            _articleRepo = articleRepo;
            _paragraphRepo = paragraphRepo;
            _uow = uow;
        }

        public async Task<ArticleContentDto> GetContentByArticleIdAsync(int articleId)
        {
            var article = await _articleRepo.GetByIdWithContentAsync(articleId);
            if (article is null)
            {
                throw new NotFoundException("Article not found");
            }

            var paragraphDtos = article.Paragraphs
                .OrderBy(paragraph => paragraph.Order)
                .Select(paragraph => new ParagraphDto(paragraph.Id, paragraph.Content, paragraph.Order, paragraph.IsDefault))
                .ToList();

            return new ArticleContentDto(
                article.Id,
                article.Title,
                paragraphDtos,
                MapInfobox(article),
                article.Summary,
                ParseTags(article.Tags),
                MapRelatedLinks(article));
        }

        public async Task<ArticleContentDto> CreateArticleWithContentAsync(ArticleContentCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                throw new ValidationException("Title is required.");
            }

            var incomingParagraphs = dto.Paragraphs ?? new List<ParagraphDto>();
            var (valid, errorMessage) = ValidateOrder(incomingParagraphs);
            if (!valid)
            {
                throw new ValidationException(errorMessage ?? "Invalid paragraph order.");
            }

            var normalizedInfobox = NormalizeInfobox(dto.Infobox);
            var (infoboxValid, infoboxErrorMessage) = ValidateInfobox(normalizedInfobox);
            if (!infoboxValid)
            {
                throw new ValidationException(infoboxErrorMessage ?? "Invalid infobox.");
            }

            try
            {
                await _uow.BeginTransactionAsync();

                var article = new Article
                {
                    Title = dto.Title,
                    ParentArticleId = dto.ParentArticleId,
                    InfoboxTitle = normalizedInfobox?.Title,
                    InfoboxSubtitle = normalizedInfobox?.Subtitle,
                    Summary = NormalizeOptionalText(dto.Summary),
                    Tags = SerializeTags(dto.Tags)
                };

                await _articleRepo.AddAsync(article);
                await _uow.SaveChangesAsync();

                foreach (var incoming in incomingParagraphs)
                {
                    var paragraph = new Paragraph
                    {
                        ArticleId = article.Id,
                        Content = incoming.Content,
                        Order = incoming.Order,
                        IsDefault = incoming.IsDefault
                    };

                    await _paragraphRepo.AddAsync(paragraph);
                }

                foreach (var incomingField in normalizedInfobox?.Fields ?? Enumerable.Empty<ArticleInfoboxFieldCreateDto>())
                {
                    article.InfoboxFields.Add(new ArticleInfoboxField
                    {
                        ArticleId = article.Id,
                        Order = incomingField.Order,
                        Key = incomingField.Key,
                        Label = incomingField.Label,
                        Value = incomingField.Value,
                    });
                }

                var (relatedLinksValid, relatedLinksError) = await ValidateRelatedLinksAsync(dto.RelatedLinks, article.Id);
                if (!relatedLinksValid)
                {
                    throw new ValidationException(relatedLinksError ?? "Invalid related links.");
                }

                foreach (var link in dto.RelatedLinks ?? Enumerable.Empty<ArticleRelatedLinkCreateDto>())
                {
                    article.RelatedLinks.Add(new ArticleRelatedLink
                    {
                        ArticleId = article.Id,
                        RelatedArticleId = link.RelatedArticleId,
                        Order = link.Order
                    });
                }

                await _uow.SaveChangesAsync();
                await _uow.CommitAsync();

                var createdArticle = await _articleRepo.GetByIdWithContentAsync(article.Id)
                    ?? throw new NotFoundException("Article not found after creation");

                var paragraphDtos = createdArticle.Paragraphs
                    .OrderBy(paragraph => paragraph.Order)
                    .Select(paragraph => new ParagraphDto(paragraph.Id, paragraph.Content, paragraph.Order, paragraph.IsDefault))
                    .ToList();

                return new ArticleContentDto(
                    createdArticle.Id,
                    createdArticle.Title,
                    paragraphDtos,
                    MapInfobox(createdArticle),
                    createdArticle.Summary,
                    ParseTags(createdArticle.Tags),
                    MapRelatedLinks(createdArticle));
            }
            catch
            {
                await _uow.RollbackAsync();
                throw;
            }
        }

        public async Task<(bool Success, string? ErrorMessage)> UpdateContentAsync(int articleId, ArticleContentDto dto)
        {
            if (!await ValidateArticleExistsAsync(articleId, dto.Id))
                return (false, "Article id mismatch or not found.");

            var incomingParagraphs = dto.Paragraphs ?? new List<ParagraphDto>();
            var (valid, errorMessage) = ValidateOrder(incomingParagraphs);
            if (!valid) return (false, errorMessage);

            var normalizedInfobox = NormalizeInfobox(dto.Infobox is null
                ? null
                : new ArticleInfoboxCreateDto(
                    dto.Infobox.Title,
                    dto.Infobox.Subtitle,
                    dto.Infobox.Fields.Select(field => new ArticleInfoboxFieldCreateDto(field.Order, field.Key, field.Label, field.Value)).ToList()));
            var (infoboxValid, infoboxErrorMessage) = ValidateInfobox(normalizedInfobox);
            if (!infoboxValid) return (false, infoboxErrorMessage);

            var existingParagraphs = (await _paragraphRepo.GetParagraphsByArticleAsync(articleId)).ToList();
            var existingIdsSet = existingParagraphs.Select(p => p.Id).ToHashSet();
            if (!ValidateIncomingIds(incomingParagraphs, existingIdsSet))
                return (false, "Some paragraph ids do not belong to this article.");

            var incomingRelatedLinks = dto.RelatedLinks?
                .Select(l => new ArticleRelatedLinkCreateDto(l.RelatedArticleId, l.Order))
                .ToList();
            var (relatedLinksValid, relatedLinksError) = await ValidateRelatedLinksAsync(incomingRelatedLinks, articleId);
            if (!relatedLinksValid) return (false, relatedLinksError);

            var article = await _articleRepo.GetByIdWithContentAsync(articleId);
            if (article is null)
            {
                return (false, "Article not found.");
            }

            try
            {
                await _uow.BeginTransactionAsync();

                await DeleteRemovedParagraphsAsync(existingParagraphs, incomingParagraphs);
                UpdateExistingParagraphs(existingParagraphs, incomingParagraphs);
                await AddNewParagraphsAsync(articleId, incomingParagraphs);
                UpdateArticleMetadata(article, dto.Title, normalizedInfobox, dto.Summary, dto.Tags, incomingRelatedLinks);

                await _uow.SaveChangesAsync();
                await _uow.CommitAsync();
                return (true, null);
            }
            catch
            {
                await _uow.RollbackAsync();
                return (false, "Error occurred while updating content.");
            }
        }

        private async Task<bool> ValidateArticleExistsAsync(int articleId, int dtoId)
        {
            if (articleId != dtoId) return false;
            return await _articleRepo.GetByIdAsync(articleId) is not null;
        }

        private (bool IsValid, string? ErrorMessage) ValidateOrder(List<ParagraphDto> paragraphs)
        {
            if (!paragraphs.Any())
                return (false, "At least one paragraph is required.");

            var orders = paragraphs.Select(p => p.Order).ToList();
            if (orders.Any(o => o < 1))
                return (false, "Order must be >= 1.");

            var distinctOrders = orders.Distinct().OrderBy(o => o).ToList();
            if (distinctOrders.Count != (distinctOrders.Any() ? distinctOrders.Max() : 0))
                return (false, "Order values must form a contiguous sequence from 1 to N.");

            var defaultOrders = paragraphs
                .Where(p => p.IsDefault)
                .Select(p => p.Order)
                .ToHashSet();

            if (distinctOrders.Any(order => !defaultOrders.Contains(order)))
                return (false, "Each order must contain one default paragraph.");

            return (true, null);
        }

        private bool ValidateIncomingIds(IEnumerable<ParagraphDto> incomingParagraphs, HashSet<int> existingIdsSet)
        {
            var incomingExistingIds = incomingParagraphs.Where(p => p.Id != 0).Select(p => p.Id);
            return incomingExistingIds.All(id => existingIdsSet.Contains(id));
        }

        private async Task<(bool IsValid, string? ErrorMessage)> ValidateRelatedLinksAsync(
            List<ArticleRelatedLinkCreateDto>? links, int articleId)
        {
            if (links is null || links.Count == 0)
                return (true, null);

            if (links.Any(l => l.RelatedArticleId == articleId))
                return (false, "An article cannot link to itself.");

            foreach (var link in links)
            {
                if (await _articleRepo.GetByIdAsync(link.RelatedArticleId) is null)
                    return (false, $"Related article with id {link.RelatedArticleId} does not exist.");
            }

            return (true, null);
        }

        private (bool IsValid, string? ErrorMessage) ValidateInfobox(ArticleInfoboxCreateDto? infobox)
        {
            if (infobox is null)
            {
                return (true, null);
            }

            var fields = infobox.Fields ?? new List<ArticleInfoboxFieldCreateDto>();

            if (fields.Count == 0)
            {
                return (true, null);
            }

            var orders = fields.Select(field => field.Order).ToList();
            if (orders.Any(order => order < 1))
            {
                return (false, "Infobox field order must be >= 1.");
            }

            var distinctOrders = orders.Distinct().OrderBy(order => order).ToList();
            if (distinctOrders.Count != (distinctOrders.Any() ? distinctOrders.Max() : 0))
            {
                return (false, "Infobox field order must form a contiguous sequence from 1 to N.");
            }

            if (fields.Any(field => string.IsNullOrWhiteSpace(field.Key)))
            {
                return (false, "Each infobox field must contain a key.");
            }

            if (fields.Any(field => string.IsNullOrWhiteSpace(field.Label)))
            {
                return (false, "Each infobox field must contain a label.");
            }

            if (fields.Any(field => string.IsNullOrWhiteSpace(field.Value)))
            {
                return (false, "Each infobox field must contain a value.");
            }

            return (true, null);
        }

        private ArticleInfoboxCreateDto? NormalizeInfobox(ArticleInfoboxCreateDto? infobox)
        {
            if (infobox is null)
            {
                return null;
            }

            var title = NormalizeOptionalText(infobox.Title);
            var subtitle = NormalizeOptionalText(infobox.Subtitle);
            var fields = (infobox.Fields ?? new List<ArticleInfoboxFieldCreateDto>())
                .Select(field => new ArticleInfoboxFieldCreateDto(
                    field.Order,
                    field.Key.Trim(),
                    field.Label.Trim(),
                    field.Value.Trim()))
                .Where(field => !string.IsNullOrWhiteSpace(field.Label) || !string.IsNullOrWhiteSpace(field.Value) || !string.IsNullOrWhiteSpace(field.Key))
                .OrderBy(field => field.Order)
                .ToList();

            if (title is null && subtitle is null && fields.Count == 0)
            {
                return null;
            }

            return new ArticleInfoboxCreateDto(title, subtitle, fields);
        }

        private static string? NormalizeOptionalText(string? value)
            => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static List<string> ParseTags(string? tags)
            => tags?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                   .Where(t => !string.IsNullOrEmpty(t))
                   .ToList()
               ?? new List<string>();

        private static string? SerializeTags(List<string>? tags)
        {
            if (tags is null || tags.Count == 0) return null;
            var normalized = tags
                .Select(t => t.Trim())
                .Where(t => !string.IsNullOrEmpty(t))
                .Distinct()
                .ToList();
            return normalized.Count == 0 ? null : string.Join(",", normalized);
        }

        private static ArticleInfoboxDto? MapInfobox(Article article)
        {
            var fields = article.InfoboxFields
                .OrderBy(field => field.Order)
                .Select(field => new ArticleInfoboxFieldDto(field.Id, field.Order, field.Key, field.Label, field.Value))
                .ToList();

            if (string.IsNullOrWhiteSpace(article.InfoboxTitle)
                && string.IsNullOrWhiteSpace(article.InfoboxSubtitle)
                && fields.Count == 0)
            {
                return null;
            }

            return new ArticleInfoboxDto(article.InfoboxTitle, article.InfoboxSubtitle, fields);
        }

        private static List<ArticleRelatedLinkDto>? MapRelatedLinks(Article article)
        {
            if (article.RelatedLinks.Count == 0)
                return null;

            return article.RelatedLinks
                .OrderBy(link => link.Order)
                .Select(link => new ArticleRelatedLinkDto(
                    link.Id,
                    link.RelatedArticleId,
                    link.RelatedArticle.Title,
                    link.Order))
                .ToList();
        }

        private async Task DeleteRemovedParagraphsAsync(List<Paragraph> existingParagraphs, List<ParagraphDto> incomingParagraphs)
        {
            var incomingIds = incomingParagraphs.Where(p => p.Id != 0).Select(p => p.Id).ToHashSet();
            var toDelete = existingParagraphs.Where(p => !incomingIds.Contains(p.Id)).ToList();
            foreach (var p in toDelete)
                await _paragraphRepo.DeleteAsync(p);
        }

        private void UpdateExistingParagraphs(List<Paragraph> existingParagraphs, List<ParagraphDto> incomingParagraphs)
        {
            var existingMap = existingParagraphs.ToDictionary(p => p.Id);
            foreach (var incoming in incomingParagraphs.Where(p => p.Id != 0))
            {
                var entity = existingMap[incoming.Id];
                entity.Content = incoming.Content;
                entity.Order = incoming.Order;
                entity.IsDefault = incoming.IsDefault;
            }
        }

        private async Task AddNewParagraphsAsync(int articleId, List<ParagraphDto> incomingParagraphs)
        {
            foreach (var incoming in incomingParagraphs.Where(p => p.Id == 0))
            {
                var newParagraph = new Paragraph
                {
                    Content = incoming.Content,
                    Order = incoming.Order,
                    IsDefault = incoming.IsDefault,
                    ArticleId = articleId
                };
                await _paragraphRepo.AddAsync(newParagraph);
            }
        }

        private void UpdateArticleMetadata(
            Article article,
            string title,
            ArticleInfoboxCreateDto? infobox,
            string? summary,
            List<string> tags,
            List<ArticleRelatedLinkCreateDto>? relatedLinks)
        {
            article.Title = title;
            article.InfoboxTitle = infobox?.Title;
            article.InfoboxSubtitle = infobox?.Subtitle;
            article.Summary = NormalizeOptionalText(summary);
            article.Tags = SerializeTags(tags);

            article.InfoboxFields.Clear();
            foreach (var field in infobox?.Fields ?? Enumerable.Empty<ArticleInfoboxFieldCreateDto>())
            {
                article.InfoboxFields.Add(new ArticleInfoboxField
                {
                    ArticleId = article.Id,
                    Order = field.Order,
                    Key = field.Key,
                    Label = field.Label,
                    Value = field.Value,
                });
            }

            article.RelatedLinks.Clear();
            foreach (var link in relatedLinks ?? Enumerable.Empty<ArticleRelatedLinkCreateDto>())
            {
                article.RelatedLinks.Add(new ArticleRelatedLink
                {
                    ArticleId = article.Id,
                    RelatedArticleId = link.RelatedArticleId,
                    Order = link.Order
                });
            }
        }
    }
}
