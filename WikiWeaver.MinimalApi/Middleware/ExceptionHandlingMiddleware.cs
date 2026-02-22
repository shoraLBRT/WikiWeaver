using System.Text.Json;
using WikiWeaver.Application.Exceptions;

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
            _logger.LogError(exception, "Unhandled exception. TraceId: {TraceId}", context.TraceIdentifier);
        }
        else
        {
            _logger.LogWarning(exception, "Handled exception. TraceId: {TraceId}", context.TraceIdentifier);
        }

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = statusCode;

        var payload = new
        {
            title,
            status = statusCode,
            code,
            traceId = context.TraceIdentifier,
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
    }
}
