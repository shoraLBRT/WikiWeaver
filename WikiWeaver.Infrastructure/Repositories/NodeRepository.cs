using Microsoft.EntityFrameworkCore;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.Infrastructure.Repositories
{
    public class NodeRepository : GenericRepository<Node>
    {
        public NodeRepository(WikiWeaverDbContext context) : base(context) { }

        public Task<int> CountAsync(CancellationToken cancellationToken = default)
            => _dbSet.CountAsync(cancellationToken);

        public Task ResetNodeRelationsAsync(CancellationToken cancellationToken = default)
            => _dbSet
                .Where(node => node.ParentId.HasValue || node.ArticleId.HasValue)
                .ExecuteUpdateAsync(
                    setters => setters
                        .SetProperty(node => node.ParentId, node => null)
                        .SetProperty(node => node.ArticleId, node => null),
                    cancellationToken);

        public Task DeleteAllAsync(CancellationToken cancellationToken = default)
            => _dbSet.ExecuteDeleteAsync(cancellationToken);
    }
}
