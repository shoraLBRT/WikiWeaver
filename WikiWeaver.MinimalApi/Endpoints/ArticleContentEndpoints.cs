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
                return content is null ? Results.NotFound() : Results.Ok(content);
            });

            group.MapPut("/{id}/content", async (int id, ArticleContentDto dto, ArticleContentService service) =>
            {
                var (success, error) = await service.UpdateContentAsync(id, dto);
                if (!success) return Results.BadRequest(new { error });
                return Results.NoContent();
            });

            return builder;
        }
    }
}
