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
            }).RequireAuthorization("AdminOnly");

            group.MapPut("/{id}", async (int id, ArticleUpdateDto updateDto, ArticleService service) =>
            {
                await service.UpdateAsync(id, updateDto);
                return Results.NoContent();
            }).RequireAuthorization("AdminOnly");

            group.MapDelete("/{id}", async (int id, ArticleService service) =>
            {
                await service.DeleteAsync(id);
                return Results.NoContent();
            }).RequireAuthorization("AdminOnly");

            return builder;
        }
    }
}
