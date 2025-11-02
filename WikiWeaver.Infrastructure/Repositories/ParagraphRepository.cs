using Microsoft.EntityFrameworkCore;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.Infrastructure.Repositories
{
    public class ParagraphRepository : GenericRepository<Paragraph>
    {
        public ParagraphRepository(WikiWeaverDbContext context) : base(context) { }

        public async Task<IEnumerable<Paragraph>> GetParagraphsByArticleAsync(int articleId)
        {
            return await _dbSet
                .Where(p => p.ArticleId == articleId)
                .OrderBy(p => p.Order)
                .ToListAsync();
        }

        public async Task<IEnumerable<Paragraph>> GetAlternativeParagraphsAsync(int articleId, int order)
        {
            return await _dbSet
                .Where(p => p.ArticleId == articleId && p.Order == order)
                .ToListAsync();
        }
    }
}
