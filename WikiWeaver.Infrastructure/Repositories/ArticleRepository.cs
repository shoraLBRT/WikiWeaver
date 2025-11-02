using Microsoft.EntityFrameworkCore;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.Infrastructure.Repositories
{
    public class ArticleRepository : GenericRepository<Article>
    {
        public ArticleRepository(WikiWeaverDbContext context) : base(context) { }

        public async Task<Article?> GetWithParagraphsAsync(int id)
        {
            return await _dbSet
                .Include(a => a.Paragraphs.OrderBy(p => p.Order))
                .FirstOrDefaultAsync(a => a.Id == id);
        }
    }
}
