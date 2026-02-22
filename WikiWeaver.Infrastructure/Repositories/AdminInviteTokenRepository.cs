using Microsoft.EntityFrameworkCore;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.Infrastructure.Repositories;

public class AdminInviteTokenRepository : GenericRepository<AdminInviteToken>
{
    public AdminInviteTokenRepository(WikiWeaverDbContext context) : base(context)
    {
    }

    public Task<AdminInviteToken?> GetActiveByHashAsync(
        string tokenHash,
        DateTime nowUtc,
        CancellationToken cancellationToken = default)
        => _dbSet.FirstOrDefaultAsync(token =>
            token.TokenHash == tokenHash
            && token.UsedAtUtc == null
            && token.ExpiresAtUtc > nowUtc,
            cancellationToken);
}
