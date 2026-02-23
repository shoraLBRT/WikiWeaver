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
        private readonly NodeRepository _nodeRepo;
        private readonly ParagraphRepository _paragraphRepo;
        private readonly IUnitOfWork _uow;

        public ArticleContentService(
            ArticleRepository articleRepo,
            NodeRepository nodeRepo,
            ParagraphRepository paragraphRepo,
            IUnitOfWork uow)
        {
            _articleRepo = articleRepo;
            _nodeRepo = nodeRepo;
            _paragraphRepo = paragraphRepo;
            _uow = uow;
        }

        public async Task<ArticleContentDto> GetContentByArticleIdAsync(int articleId)
        {
            var article = await _articleRepo.GetByIdAsync(articleId);
            if (article is null)
            {
                throw new NotFoundException("Article not found");
            }

            return await BuildArticleContentDtoAsync(article);
        }

        public async Task<ArticleContentDto?> GetContentByNodeIdAsync(int nodeId)
        {
            var article = await _articleRepo.GetByNodeIdAsync(nodeId);
            return article is null ? null : await BuildArticleContentDtoAsync(article);
        }

        public async Task<ArticleContentDto> CreateArticleWithContentAsync(ArticleContentCreateDto dto)
        {
            ValidateTitle(dto.Title);
            await ValidateNodeAsync(dto.NodeId);

            var incomingParagraphs = dto.Paragraphs ?? new List<ParagraphDto>();
            var (valid, errorMessage) = ValidateOrder(incomingParagraphs);
            if (!valid)
            {
                throw new ValidationException(errorMessage ?? "Invalid paragraph order.");
            }

            try
            {
                await _uow.BeginTransactionAsync();

                var article = new Article
                {
                    Title = dto.Title,
                    NodeId = dto.NodeId,
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
                        IsDefault = incoming.IsDefault,
                    };

                    await _paragraphRepo.AddAsync(paragraph);
                }

                await _uow.SaveChangesAsync();
                await _uow.CommitAsync();

                return await BuildArticleContentDtoAsync(article);
            }
            catch
            {
                await _uow.RollbackAsync();
                throw;
            }
        }

        public async Task<ArticleContentDto> UpdateContentAsync(int articleId, ArticleContentDto dto)
        {
            if (!await ValidateArticleExistsAsync(articleId, dto.Id))
            {
                throw new ValidationException("Article id mismatch or not found.");
            }

            var incomingParagraphs = dto.Paragraphs ?? new List<ParagraphDto>();
            var (valid, errorMessage) = ValidateOrder(incomingParagraphs);
            if (!valid)
            {
                throw new ValidationException(errorMessage ?? "Invalid paragraph order.");
            }

            var existingParagraphs = (await _paragraphRepo.GetParagraphsByArticleAsync(articleId)).ToList();
            var existingIdsSet = existingParagraphs.Select(p => p.Id).ToHashSet();
            if (!ValidateIncomingIds(incomingParagraphs, existingIdsSet))
            {
                throw new ValidationException("Some paragraph ids do not belong to this article.");
            }

            try
            {
                await _uow.BeginTransactionAsync();

                await DeleteRemovedParagraphsAsync(existingParagraphs, incomingParagraphs);
                UpdateExistingParagraphs(existingParagraphs, incomingParagraphs);
                await AddNewParagraphsAsync(articleId, incomingParagraphs);
                await UpdateArticleTitleAsync(articleId, dto.Title);

                await _uow.SaveChangesAsync();
                await _uow.CommitAsync();
            }
            catch
            {
                await _uow.RollbackAsync();
                throw new ValidationException("Error occurred while updating content.");
            }

            var updatedArticle = await _articleRepo.GetByIdAsync(articleId)
                ?? throw new NotFoundException("Article not found");

            return await BuildArticleContentDtoAsync(updatedArticle);
        }

        private static void ValidateTitle(string title)
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                throw new ValidationException("Title is required.");
            }
        }

        private async Task ValidateNodeAsync(int? nodeId)
        {
            if (!nodeId.HasValue)
            {
                return;
            }

            var node = await _nodeRepo.GetByIdAsync(nodeId.Value);
            if (node is null)
            {
                throw new ValidationException("Node not found.");
            }

            var existingArticle = await _articleRepo.GetByNodeIdAsync(nodeId.Value);
            if (existingArticle is not null)
            {
                throw new ValidationException("Selected node already has an article.");
            }
        }

        private async Task<ArticleContentDto> BuildArticleContentDtoAsync(Article article)
        {
            var paragraphs = await _paragraphRepo.GetParagraphsByArticleAsync(article.Id);
            var paragraphDtos = paragraphs
                .OrderBy(p => p.Order)
                .Select(p => new ParagraphDto(p.Id, p.Content, p.Order, p.IsDefault))
                .ToList();

            return new ArticleContentDto(article.Id, article.Title, paragraphDtos);
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

        private async Task DeleteRemovedParagraphsAsync(List<Paragraph> existingParagraphs, List<ParagraphDto> incomingParagraphs)
        {
            var incomingIds = incomingParagraphs.Where(p => p.Id != 0).Select(p => p.Id).ToHashSet();
            var toDelete = existingParagraphs.Where(p => !incomingIds.Contains(p.Id)).ToList();
            foreach (var paragraph in toDelete)
            {
                await _paragraphRepo.DeleteAsync(paragraph);
            }
        }

        private static void UpdateExistingParagraphs(List<Paragraph> existingParagraphs, List<ParagraphDto> incomingParagraphs)
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
                    ArticleId = articleId,
                };
                await _paragraphRepo.AddAsync(newParagraph);
            }
        }

        private async Task UpdateArticleTitleAsync(int articleId, string title)
        {
            var article = await _articleRepo.GetByIdAsync(articleId);
            if (article is null) return;
            article.Title = title;
            await _articleRepo.UpdateAsync(article);
        }
    }
}
