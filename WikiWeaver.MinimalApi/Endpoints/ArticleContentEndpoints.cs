using WikiWeaver.Application.DTOs;
using WikiWeaver.Application.Services;

namespace WikiWeaver.MinimalApi.Endpoints
{
    public static class ArticleContentEndpoints
    {
        public static IEndpointRouteBuilder MapArticleContentEndpoints(this IEndpointRouteBuilder builder)
        {
            var group = builder.MapGroup("/articles").WithTags("ArticleContent");

            group.MapGet("/{id:int}/content", async (int id, ArticleContentService service) =>
            {
                var content = await service.GetContentByArticleIdAsync(id);
                return Results.Ok(content);
            });

            group.MapPost("/content", async (ArticleContentCreateDto dto, ArticleContentService service) =>
            {
                var article = await service.CreateArticleWithContentAsync(dto);
                return Results.Created($"/articles/{article.Id}/content", article);
            }).RequireAuthorization("AdminOnly");

            group.MapPut("/{id:int}/content", async (int id, ArticleContentDto dto, ArticleContentService service) =>
            {
                var (success, errorMessage) = await service.UpdateContentAsync(id, dto);
                return success ? Results.NoContent() : Results.BadRequest(errorMessage);
            }).RequireAuthorization("AdminOnly");

            return builder;
        }
    }
}
