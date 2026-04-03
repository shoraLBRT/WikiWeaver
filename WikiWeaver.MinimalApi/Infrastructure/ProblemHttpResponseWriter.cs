using System.Text.Json;

namespace WikiWeaver.MinimalApi.Infrastructure;

internal static class ProblemHttpResponseWriter
{
    public static Task WriteAsync(
        HttpContext context,
        int statusCode,
        string code,
        string title,
        CancellationToken cancellationToken = default)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        return context.Response.WriteAsync(
            JsonSerializer.Serialize(new
            {
                title,
                status = statusCode,
                code,
                traceId = context.TraceIdentifier,
            }),
            cancellationToken);
    }
}
