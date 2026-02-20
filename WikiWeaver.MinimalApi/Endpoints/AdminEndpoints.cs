using WikiWeaver.Application.DTOs;
using WikiWeaver.Application.Services;

namespace WikiWeaver.MinimalApi.Endpoints;

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("/admin").WithTags("Admin");

        group.MapPost("/cleanup", async (AdminService service, CancellationToken cancellationToken) =>
        {
            var result = await service.CleanupDemoDataAsync(cancellationToken);
            return Results.Ok(result);
        });

        group.MapGet("/ai-settings", async (AdminService service, CancellationToken cancellationToken) =>
        {
            var result = await service.GetAiSettingsAsync(cancellationToken);
            return Results.Ok(result);
        });

        group.MapPut("/ai-settings", async (
            UpdateAiProviderSettingsDto request,
            AdminService service,
            CancellationToken cancellationToken) =>
        {
            var result = await service.UpdateAiSettingsAsync(request, cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.BadRequest(new { message = result.ErrorMessage });
        });

        group.MapPost("/ai-style", async (
            AiStyleRequestDto request,
            AdminService service,
            CancellationToken cancellationToken) =>
        {
            var result = await service.StyleMarkdownAsync(request.Text, cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.BadRequest(new { message = result.ErrorMessage });
        });

        group.MapPost("/ai-check", async (AdminService service, CancellationToken cancellationToken) =>
        {
            var result = await service.CheckAiConnectionAsync(cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.BadRequest(new { message = result.ErrorMessage });
        });

        return builder;
    }
}
