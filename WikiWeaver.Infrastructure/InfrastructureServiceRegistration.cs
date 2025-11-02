using Microsoft.Extensions.DependencyInjection;
using WikiWeaver.Infrastructure.Repositories;

namespace WikiWeaver.Infrastructure
{
    public static class InfrastructureServiceRegistration
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services)
        {
            services.AddScoped<ArticleRepository>();
            services.AddScoped<ParagraphRepository>();
            services.AddScoped<NodeRepository>();
            return services;
        }
    }
}
