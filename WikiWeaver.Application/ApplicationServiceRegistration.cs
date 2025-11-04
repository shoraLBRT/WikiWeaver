using Microsoft.Extensions.DependencyInjection;
using WikiWeaver.Application.Services;

namespace WikiWeaver.Application
{
    public static class ApplicationServiceRegistration
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            services.AddScoped<NodeService>();
            return services;
        }
    }
}
