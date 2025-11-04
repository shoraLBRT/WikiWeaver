using Microsoft.EntityFrameworkCore;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.Infrastructure.Repositories
{
    public class NodeRepository : GenericRepository<Node>
    {
        public NodeRepository(WikiWeaverDbContext context) : base(context) { }
        public async Task<List<Node>?> GetAllNodesWithArticlesAsync()
        {
            var nodesWithArticles = await _dbSet
                .Include(n => n.Children)
                .Include(n => n.Article).ToListAsync();
            return nodesWithArticles;
        }
    }
}
