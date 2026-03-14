using Microsoft.Extensions.DependencyInjection;
using WikiWeaver.Application.Services;

namespace WikiWeaver.Application
{
    public static class ApplicationServiceRegistration
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            services.AddScoped<ArticleService>();
            services.AddScoped<ParagraphService>();
            services.AddScoped<NavigationTreeService>();
            services.AddScoped<ArticleContentService>();
            services.AddScoped<AdminService>();
            services.AddScoped<AdminAuthService>();
            return services;
        }
    }
}
