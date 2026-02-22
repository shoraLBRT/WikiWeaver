using Microsoft.EntityFrameworkCore;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.Infrastructure.Repositories
{
    public class ParagraphRepository : GenericRepository<Paragraph>
    {
        public ParagraphRepository(WikiWeaverDbContext context) : base(context) { }

        public Task<int> CountAsync(CancellationToken cancellationToken = default)
            => _dbSet.CountAsync(cancellationToken);

        public Task DeleteAllAsync(CancellationToken cancellationToken = default)
            => _dbSet.ExecuteDeleteAsync(cancellationToken);
    }
}
