using WikiWeaver.Application.DTOs;
using WikiWeaver.Application.Services;

namespace WikiWeaver.MinimalApi.Endpoints
{
    public static class ParagraphEndpoints
    {
        public static IEndpointRouteBuilder MapParagraphEndpoints(this IEndpointRouteBuilder builder)
        {
            var group = builder.MapGroup("/paragraph").WithTags("Paragraphs");

            group.MapGet("/", async (ParagraphService service) =>
            {
                var paragraphs = await service.GetAllAsync();
                return Results.Ok(paragraphs);
            });

            group.MapGet("/{id}", async (int id, ParagraphService service) =>
            {
                var paragraph = await service.GetByIdAsync(id);
                return paragraph is not null ? Results.Ok(paragraph) : Results.NotFound();
            });

            group.MapPost("/", async (ParagraphCreateDto createDto, ParagraphService service) =>
            {
                var createdParagraph = await service.CreateAsync(createDto);
                return Results.Created($"/paragraph/{createdParagraph.Id}", createdParagraph);
            });

            group.MapDelete("/{id}", async (int id, ParagraphService service) =>
            {
                var success = await service.DeleteAsync(id);
                return success ? Results.NoContent() : Results.NotFound();
            });

            return builder;
        }
    }
}
