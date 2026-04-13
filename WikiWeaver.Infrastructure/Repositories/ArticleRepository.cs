using Microsoft.EntityFrameworkCore;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.Infrastructure.Repositories
{
    public class ArticleRepository : GenericRepository<Article>
    {
        public ArticleRepository(WikiWeaverDbContext context) : base(context) { }

        public Task<List<Article>> GetAllWithHierarchyAsync(CancellationToken cancellationToken = default)
            => _dbSet
                .Include(article => article.ChildArticles)
                .Include(article => article.Paragraphs)
                .Include(article => article.InfoboxFields)
                .Include(article => article.RelatedLinks)
                .ToListAsync(cancellationToken);

        public Task<List<Article>> GetAllWithParagraphsAsync(CancellationToken cancellationToken = default)
            => _dbSet
                .Include(article => article.Paragraphs)
                .Include(article => article.InfoboxFields)
                .Include(article => article.RelatedLinks)
                .ToListAsync(cancellationToken);

        public Task<Article?> GetByIdWithContentAsync(int articleId, CancellationToken cancellationToken = default)
            => _dbSet
                .Include(article => article.Paragraphs)
                .Include(article => article.InfoboxFields)
                .Include(article => article.RelatedLinks)
                    .ThenInclude(link => link.RelatedArticle)
                .FirstOrDefaultAsync(article => article.Id == articleId, cancellationToken);

        public Task<int> CountAsync(CancellationToken cancellationToken = default)
            => _dbSet.CountAsync(cancellationToken);

        public Task NullifyAllParentIdsAsync(CancellationToken cancellationToken = default)
            => _dbSet.ExecuteUpdateAsync(
                s => s.SetProperty(a => a.ParentArticleId, (int?)null),
                cancellationToken);

        public Task DeleteAllAsync(CancellationToken cancellationToken = default)
            => _dbSet.ExecuteDeleteAsync(cancellationToken);
    }
}
