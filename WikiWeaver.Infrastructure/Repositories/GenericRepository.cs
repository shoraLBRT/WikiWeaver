using Microsoft.EntityFrameworkCore;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.Infrastructure.Repositories
{
    public class GenericRepository<T> where T : class
    {
        protected readonly WikiWeaverDbContext _context;
        protected readonly DbSet<T> _dbSet;

        public GenericRepository(WikiWeaverDbContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }

        public async Task<IEnumerable<T>> GetAllAsync() => await _dbSet.ToListAsync();
        public async Task<T?> GetByIdAsync(int id) => await _dbSet.FindAsync(id);
        public async Task AddAsync(T entity) => await _dbSet.AddAsync(entity);
        public async Task UpdateAsync(T entity) => _dbSet.Update(entity);
        public async Task DeleteAsync(T entity) => _dbSet.Remove(entity);
        public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
    }
}
