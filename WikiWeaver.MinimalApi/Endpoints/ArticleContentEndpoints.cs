using WikiWeaver.Application.DTOs;
using WikiWeaver.Application.Services;

namespace WikiWeaver.MinimalApi.Endpoints
{
    public static class ArticleContentEndpoints
    {
        public static IEndpointRouteBuilder MapArticleContentEndpoints(this IEndpointRouteBuilder builder)
        {
            var group = builder.MapGroup("/article").WithTags("ArticleContent");

            group.MapGet("/{id}/content", async (int id, ArticleContentService service) =>
            {
                var content = await service.GetContentByArticleIdAsync(id);
                return Results.Ok(content);
            });

            group.MapGet("/node/{nodeId}/content", async (int nodeId, ArticleContentService service) =>
            {
                var content = await service.GetContentByNodeIdAsync(nodeId);
                return content is null ? Results.NoContent() : Results.Ok(content);
            }).RequireAuthorization("AdminOnly");

            group.MapPost("/content", async (ArticleContentCreateDto dto, ArticleContentService service) =>
            {
                var article = await service.CreateArticleWithContentAsync(dto);
                return Results.Created($"/article/{article.Id}/content", article);
            }).RequireAuthorization("AdminOnly");

            group.MapPut("/{id}/content", async (int id, ArticleContentDto dto, ArticleContentService service) =>
            {
                var article = await service.UpdateContentAsync(id, dto);
                return Results.Ok(article);
            }).RequireAuthorization("AdminOnly");

            return builder;
        }
    }
}
