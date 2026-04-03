using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Net.Http.Headers;

namespace WikiWeaver.MinimalApi.Infrastructure;

internal sealed class JwtProblemEvents : JwtBearerEvents
{
    private const string AuthFailureItemKey = "auth.failure.reason";

    public override Task AuthenticationFailed(AuthenticationFailedContext context)
    {
        context.HttpContext.Items[AuthFailureItemKey] = context.Exception.GetType().Name;
        return Task.CompletedTask;
    }

    public override async Task Challenge(JwtBearerChallengeContext context)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.HandleResponse();
        context.Response.Headers.Remove(HeaderNames.WWWAuthenticate);

        var logger = context.HttpContext.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger<JwtProblemEvents>();

        logger.LogWarning(
            "Unauthorized request. StatusCode: {StatusCode}, Method: {Method}, Path: {Path}, TraceId: {TraceId}, UserId: {UserId}, Failure: {Failure}",
            StatusCodes.Status401Unauthorized,
            context.Request.Method,
            context.Request.Path,
            context.HttpContext.TraceIdentifier,
            context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            context.AuthenticateFailure?.GetType().Name
                ?? context.HttpContext.Items[AuthFailureItemKey]?.ToString()
                ?? "AuthenticationRequired");

        await ProblemHttpResponseWriter.WriteAsync(
            context.HttpContext,
            StatusCodes.Status401Unauthorized,
            "unauthorized",
            "Authentication is required.");
    }

    public override async Task Forbidden(ForbiddenContext context)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        var logger = context.HttpContext.RequestServices
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger<JwtProblemEvents>();

        logger.LogWarning(
            "Forbidden request. StatusCode: {StatusCode}, Method: {Method}, Path: {Path}, TraceId: {TraceId}, UserId: {UserId}",
            StatusCodes.Status403Forbidden,
            context.Request.Method,
            context.Request.Path,
            context.HttpContext.TraceIdentifier,
            context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

        await ProblemHttpResponseWriter.WriteAsync(
            context.HttpContext,
            StatusCodes.Status403Forbidden,
            "forbidden",
            "You do not have permission to perform this action.");
    }
}
