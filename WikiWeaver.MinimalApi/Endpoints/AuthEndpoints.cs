using System.Security.Claims;
using WikiWeaver.Application.DTOs;
using WikiWeaver.Application.Services;

namespace WikiWeaver.MinimalApi.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("/auth").WithTags("Auth");

        group.MapGet("/status", async (AdminAuthService service, CancellationToken cancellationToken) =>
        {
            var status = await service.GetAuthStatusAsync(cancellationToken);
            return Results.Ok(status);
        });

        group.MapPost("/register", async (
            AdminRegisterRequestDto request,
            AdminAuthService service,
            CancellationToken cancellationToken) =>
        {
            var result = await service.RegisterAsync(request, cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.BadRequest(new { message = result.ErrorMessage });
        });

        group.MapPost("/login", async (
            AdminLoginRequestDto request,
            AdminAuthService service,
            CancellationToken cancellationToken) =>
        {
            var result = await service.LoginAsync(request, cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.BadRequest(new { message = result.ErrorMessage });
        });

        group.MapPost("/invite-token", async (
            ClaimsPrincipal principal,
            AdminAuthService service,
            CancellationToken cancellationToken) =>
        {
            var adminIdClaim = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(adminIdClaim, out var adminId))
            {
                return Results.Unauthorized();
            }

            var result = await service.GenerateInviteTokenAsync(adminId, cancellationToken);
            return result.IsSuccess
                ? Results.Ok(result.Value)
                : Results.BadRequest(new { message = result.ErrorMessage });
        }).RequireAuthorization("AdminOnly");

        return builder;
    }
}
