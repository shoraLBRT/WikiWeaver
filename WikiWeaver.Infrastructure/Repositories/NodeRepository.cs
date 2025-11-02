using Microsoft.EntityFrameworkCore;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.Infrastructure.Repositories
{
    public class NodeRepository : GenericRepository<Node>
    {
        public NodeRepository(WikiWeaverDbContext context) : base(context) { }

        public async Task<Node?> GetNodeWithChildrenAsync(int id)
        {
            return await _dbSet
                .Include(n => n.Children)
                .Include(n => n.Article)
                    .ThenInclude(a => a.Paragraphs)
                .FirstOrDefaultAsync(n => n.Id == id);
        }
    }
}
