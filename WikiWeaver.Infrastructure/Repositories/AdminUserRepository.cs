using Microsoft.EntityFrameworkCore;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.Infrastructure.Repositories;

public class AdminUserRepository : GenericRepository<AdminUser>
{
    public AdminUserRepository(WikiWeaverDbContext context) : base(context)
    {
    }

    public Task<bool> AnyAsync(CancellationToken cancellationToken = default)
        => _dbSet.AnyAsync(cancellationToken);

    public Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
        => _dbSet.AnyAsync(admin => admin.Email == email, cancellationToken);

    public Task<AdminUser?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
        => _dbSet.FirstOrDefaultAsync(user => user.Email == email, cancellationToken);
}
