using System.Security.Claims;
using WikiWeaver.Application.Exceptions;
using WikiWeaver.MinimalApi.Infrastructure;

namespace WikiWeaver.MinimalApi.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            await HandleExceptionAsync(context, exception);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, code, title) = exception switch
        {
            AppException appException => (appException.StatusCode, appException.Code, appException.Message),
            _ => (StatusCodes.Status500InternalServerError, "internal_error", "Internal server error"),
        };

        if (statusCode >= StatusCodes.Status500InternalServerError)
        {
            _logger.LogError(
                exception,
                "Unhandled exception. StatusCode: {StatusCode}, Method: {Method}, Path: {Path}, TraceId: {TraceId}, UserId: {UserId}",
                statusCode,
                context.Request.Method,
                context.Request.Path,
                context.TraceIdentifier,
                GetUserId(context));
        }
        else
        {
            _logger.LogWarning(
                exception,
                "Handled exception. StatusCode: {StatusCode}, Method: {Method}, Path: {Path}, TraceId: {TraceId}, UserId: {UserId}",
                statusCode,
                context.Request.Method,
                context.Request.Path,
                context.TraceIdentifier,
                GetUserId(context));
        }

        if (context.Response.HasStarted)
        {
            _logger.LogWarning(
                "Could not write problem response because the response already started. Method: {Method}, Path: {Path}, TraceId: {TraceId}",
                context.Request.Method,
                context.Request.Path,
                context.TraceIdentifier);
            return;
        }

        await ProblemHttpResponseWriter.WriteAsync(context, statusCode, code, title);
    }

    private static string? GetUserId(HttpContext context)
    {
        return context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}
