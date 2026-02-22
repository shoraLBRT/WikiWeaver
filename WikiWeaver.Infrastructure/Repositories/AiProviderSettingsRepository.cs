using Microsoft.EntityFrameworkCore;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.Infrastructure.Repositories;

public class AiProviderSettingsRepository : GenericRepository<AiProviderSettings>
{
    public AiProviderSettingsRepository(WikiWeaverDbContext context) : base(context)
    {
    }

    public Task<AiProviderSettings?> GetSettingsAsync(CancellationToken cancellationToken = default)
        => _dbSet.FirstOrDefaultAsync(cancellationToken);
}
