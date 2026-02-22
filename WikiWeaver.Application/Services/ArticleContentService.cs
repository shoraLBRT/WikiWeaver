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
            var article = await _articleRepo.GetByIdAsync(articleId);
            if (article is null)
            {
                throw new NotFoundException("Article not found");
            }

            var paragraphs = await _paragraphRepo.GetParagraphsByArticleAsync(articleId);
            var paragraphDtos = paragraphs
                .OrderBy(p => p.Order)
                .Select(p => new ParagraphDto(p.Id, p.Content, p.Order, p.IsDefault))
                .ToList();

            return new ArticleContentDto(article.Id, article.Title, paragraphDtos);
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

            try
            {
                await _uow.BeginTransactionAsync();

                var article = new Article
                {
                    Title = dto.Title,
                    NodeId = dto.NodeId
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

                await _uow.SaveChangesAsync();
                await _uow.CommitAsync();

                var paragraphDtos = (await _paragraphRepo.GetParagraphsByArticleAsync(article.Id))
                    .OrderBy(p => p.Order)
                    .Select(p => new ParagraphDto(p.Id, p.Content, p.Order, p.IsDefault))
                    .ToList();

                return new ArticleContentDto(article.Id, article.Title, paragraphDtos);
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

            var existingParagraphs = (await _paragraphRepo.GetParagraphsByArticleAsync(articleId)).ToList();
            var existingIdsSet = existingParagraphs.Select(p => p.Id).ToHashSet();
            if (!ValidateIncomingIds(incomingParagraphs, existingIdsSet))
                return (false, "Some paragraph ids do not belong to this article.");

            try
            {
                await _uow.BeginTransactionAsync();

                await DeleteRemovedParagraphsAsync(existingParagraphs, incomingParagraphs);
                UpdateExistingParagraphs(existingParagraphs, incomingParagraphs);
                await AddNewParagraphsAsync(articleId, incomingParagraphs);
                await UpdateArticleTitleAsync(articleId, dto.Title);

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

        private async Task UpdateArticleTitleAsync(int articleId, string title)
        {
            var article = await _articleRepo.GetByIdAsync(articleId);
            if (article is null) return;
            article.Title = title;
            await _articleRepo.UpdateAsync(article);
        }
    }
}
