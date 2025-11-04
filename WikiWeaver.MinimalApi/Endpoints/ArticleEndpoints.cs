using WikiWeaver.Application.DTOs;
using WikiWeaver.Application.Services;

namespace WikiWeaver.MinimalApi.Endpoints
{
    public static class ArticleEndpoints
    {
        public static IEndpointRouteBuilder MapArticleEndpoints(this IEndpointRouteBuilder builder)
        {
            var group = builder.MapGroup("/article").WithTags("Article");

            group.MapGet("/", async (ArticleService service) =>
            {
                var articles = await service.GetAllAsync();
                return Results.Ok(articles);
            });

            group.MapGet("/{id}", async (int id, ArticleService service) =>
            {
                var article = await service.GetByIdAsync(id);
                return article is not null ? Results.Ok(article) : Results.NotFound();
            });

            group.MapPost("/", async (ArticleCreateDto createDto, ArticleService service) =>
            {
                var createdArticle = await service.CreateAsync(createDto);
                return Results.Created($"/articles/{createdArticle.Id}", createdArticle);
            });

            group.MapDelete("/{id}", async (int id, ArticleService service) =>
            {
                var success = await service.DeleteAsync(id);
                return success ? Results.NoContent() : Results.NotFound();
            });

            return builder;
        }
    }
}
