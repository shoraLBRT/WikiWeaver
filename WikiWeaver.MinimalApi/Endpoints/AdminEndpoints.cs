using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.MinimalApi.Endpoints;

public static class AdminEndpoints
{
    private const string MarkdownStylingSystemPrompt = """
Ты редактор Markdown-стиля. Твоя задача: улучшить оформление markdown, пунктуацию, орфографию и читаемость.
Строгие ограничения:
1) Не меняй смысл текста.
2) Не переставляй слова и не перефразируй предложения.
3) Не добавляй и не удаляй факты.
4) Сохраняй исходный язык.
5) Верни только готовый Markdown без комментариев и пояснений.
""";

    private const string AiConnectionTestText = "Это тестовый текст для проверки ИИ стилизации markdown он должен вернуть аккуратный markdown без изменения порядка слов";

    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("/admin").WithTags("Admin");

        group.MapPost("/cleanup", async (WikiWeaverDbContext dbContext, ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("AdminCleanup");

            var nodeCount = await dbContext.Nodes.CountAsync();
            var articleCount = await dbContext.Articles.CountAsync();
            var paragraphCount = await dbContext.Paragraphs.CountAsync();

            await using var transaction = await dbContext.Database.BeginTransactionAsync();

            if (dbContext.Database.IsSqlite())
            {
                await dbContext.Database.ExecuteSqlRawAsync(
                    "UPDATE \"Nodes\" SET \"ParentId\" = NULL, \"ArticleId\" = NULL WHERE \"ParentId\" IS NOT NULL OR \"ArticleId\" IS NOT NULL;");
                await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM \"Paragraphs\";");
                await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM \"Articles\";");
                await dbContext.Database.ExecuteSqlRawAsync("DELETE FROM \"Nodes\";");
                await dbContext.Database.ExecuteSqlRawAsync(
                    "DELETE FROM sqlite_sequence WHERE name IN ('Paragraphs', 'Articles', 'Nodes');");
            }
            else
            {
                await dbContext.Database.ExecuteSqlRawAsync(
                    "TRUNCATE TABLE \"Paragraphs\", \"Articles\", \"Nodes\" RESTART IDENTITY CASCADE;");
            }

            await transaction.CommitAsync();

            logger.LogWarning(
                "Public admin cleanup executed. Deleted Nodes: {NodeCount}, Articles: {ArticleCount}, Paragraphs: {ParagraphCount}",
                nodeCount,
                articleCount,
                paragraphCount);

            return Results.Ok(new
            {
                deletedNodes = nodeCount,
                deletedArticles = articleCount,
                deletedParagraphs = paragraphCount,
                message = "Cleanup completed"
            });
        });

        group.MapGet("/ai-settings", async (WikiWeaverDbContext dbContext) =>
        {
            var settings = await GetOrCreateAiSettingsAsync(dbContext);
            return Results.Ok(ToResponse(settings));
        });

        group.MapPut("/ai-settings", async (UpdateAiSettingsRequest request, WikiWeaverDbContext dbContext) =>
        {
            if (string.IsNullOrWhiteSpace(request.BaseUrl) || string.IsNullOrWhiteSpace(request.Model))
            {
                return Results.BadRequest(new { message = "BaseUrl and model are required." });
            }

            var settings = await GetOrCreateAiSettingsAsync(dbContext);
            settings.BaseUrl = request.BaseUrl.Trim().TrimEnd('/');
            settings.Model = request.Model.Trim();
            settings.IsEnabled = request.IsEnabled;

            if (!string.IsNullOrWhiteSpace(request.ApiKey))
            {
                settings.ApiKey = request.ApiKey.Trim();
            }

            if (request.ClearApiKey)
            {
                settings.ApiKey = null;
            }

            await dbContext.SaveChangesAsync();
            return Results.Ok(ToResponse(settings));
        });

        group.MapPost("/ai-style", async (
            AiStyleRequest request,
            WikiWeaverDbContext dbContext,
            IHttpClientFactory httpClientFactory,
            ILoggerFactory loggerFactory,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.Text))
            {
                return Results.BadRequest(new { message = "Text is required." });
            }

            var logger = loggerFactory.CreateLogger("AdminAiStyle");
            var settings = await GetOrCreateAiSettingsAsync(dbContext);

            var result = await TryStyleTextWithProviderAsync(
                request.Text,
                settings,
                httpClientFactory,
                logger,
                cancellationToken);

            if (!result.IsSuccess)
            {
                return Results.BadRequest(new { message = result.ErrorMessage });
            }

            return Results.Ok(new { styledText = result.StyledText });
        });

        group.MapPost("/ai-check", async (
            WikiWeaverDbContext dbContext,
            IHttpClientFactory httpClientFactory,
            ILoggerFactory loggerFactory,
            CancellationToken cancellationToken) =>
        {
            var logger = loggerFactory.CreateLogger("AdminAiCheck");
            var settings = await GetOrCreateAiSettingsAsync(dbContext);

            var result = await TryStyleTextWithProviderAsync(
                AiConnectionTestText,
                settings,
                httpClientFactory,
                logger,
                cancellationToken);

            if (!result.IsSuccess)
            {
                return Results.BadRequest(new { message = result.ErrorMessage });
            }

            return Results.Ok(new
            {
                message = "Проверка прошла успешно. Провайдер отвечает и возвращает текст.",
                styledText = result.StyledText
            });
        });

        return builder;
    }

    private static async Task<AiStyleResult> TryStyleTextWithProviderAsync(
        string text,
        AiProviderSettings settings,
        IHttpClientFactory httpClientFactory,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        if (!settings.IsEnabled)
        {
            return AiStyleResult.Failure("ИИ отключён. Включите 'Использовать ИИ стилизацию' в настройках.");
        }

        if (string.IsNullOrWhiteSpace(settings.ApiKey))
        {
            return AiStyleResult.Failure("API key не настроен. Добавьте ключ и сохраните настройки.");
        }

        var payload = new
        {
            model = settings.Model,
            temperature = 0.1,
            messages = new object[]
            {
                new { role = "system", content = MarkdownStylingSystemPrompt },
                new { role = "user", content = text }
            }
        };

        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiKey);

        var endpoint = BuildChatCompletionsEndpoint(settings.BaseUrl);
        using var response = await client.PostAsJsonAsync(endpoint, payload, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            logger.LogWarning(
                "AI provider request failed. StatusCode: {StatusCode}, Response: {Response}",
                (int)response.StatusCode,
                error);

            var detailedMessage = $"AI provider request failed ({(int)response.StatusCode}): {ExtractProviderErrorMessage(error)}";
            return AiStyleResult.Failure(detailedMessage);
        }

        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        var styledText = TryExtractContent(json.RootElement);
        if (string.IsNullOrWhiteSpace(styledText))
        {
            return AiStyleResult.Failure("AI provider returned empty content.");
        }

        return AiStyleResult.Success(styledText);
    }

    private static async Task<AiProviderSettings> GetOrCreateAiSettingsAsync(WikiWeaverDbContext dbContext)
    {
        try
        {
            return await GetOrCreateAiSettingsCoreAsync(dbContext);
        }
        catch (SqliteException ex) when (ex.SqliteErrorCode == 1 && ex.Message.Contains("no such table: AiProviderSettings", StringComparison.OrdinalIgnoreCase))
        {
            await EnsureAiProviderSettingsTableAsync(dbContext);
            return await GetOrCreateAiSettingsCoreAsync(dbContext);
        }
    }

    private static async Task<AiProviderSettings> GetOrCreateAiSettingsCoreAsync(WikiWeaverDbContext dbContext)
    {
        var settings = await dbContext.AiProviderSettings.FirstOrDefaultAsync();
        if (settings is not null)
        {
            return settings;
        }

        settings = new AiProviderSettings();
        dbContext.AiProviderSettings.Add(settings);
        await dbContext.SaveChangesAsync();
        return settings;
    }

    private static async Task EnsureAiProviderSettingsTableAsync(WikiWeaverDbContext dbContext)
    {
        await dbContext.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS "AiProviderSettings" (
                "Id" INTEGER NOT NULL CONSTRAINT "PK_AiProviderSettings" PRIMARY KEY AUTOINCREMENT,
                "BaseUrl" TEXT NOT NULL,
                "Model" TEXT NOT NULL,
                "ApiKey" TEXT NULL,
                "IsEnabled" INTEGER NOT NULL
            );
            """);
    }

    private static object ToResponse(AiProviderSettings settings) => new
    {
        baseUrl = settings.BaseUrl,
        model = settings.Model,
        isEnabled = settings.IsEnabled,
        hasApiKey = !string.IsNullOrWhiteSpace(settings.ApiKey)
    };

    private static string BuildChatCompletionsEndpoint(string baseUrl)
    {
        var trimmed = baseUrl.Trim().TrimEnd('/');
        return trimmed.EndsWith("/v1", StringComparison.OrdinalIgnoreCase)
            ? $"{trimmed}/chat/completions"
            : $"{trimmed}/v1/chat/completions";
    }

    private static string ExtractProviderErrorMessage(string rawError)
    {
        if (string.IsNullOrWhiteSpace(rawError))
            return "empty provider response";

        try
        {
            using var document = JsonDocument.Parse(rawError);
            var root = document.RootElement;

            if (root.TryGetProperty("error", out var errorElement))
            {
                if (errorElement.ValueKind == JsonValueKind.String)
                    return errorElement.GetString() ?? "provider error";

                if (errorElement.TryGetProperty("message", out var messageElement) && messageElement.ValueKind == JsonValueKind.String)
                    return messageElement.GetString() ?? "provider error";
            }

            if (root.TryGetProperty("message", out var rootMessage) && rootMessage.ValueKind == JsonValueKind.String)
                return rootMessage.GetString() ?? "provider error";
        }
        catch (JsonException)
        {
            // Fallback to plain text below.
        }

        const int maxLength = 400;
        return rawError.Length <= maxLength ? rawError : rawError[..maxLength];
    }

    private static string? TryExtractContent(JsonElement root)
    {
        if (!root.TryGetProperty("choices", out var choices) || choices.ValueKind != JsonValueKind.Array || choices.GetArrayLength() == 0)
            return null;

        var firstChoice = choices[0];
        if (!firstChoice.TryGetProperty("message", out var message) || !message.TryGetProperty("content", out var content))
            return null;

        if (content.ValueKind == JsonValueKind.String)
            return content.GetString();

        if (content.ValueKind != JsonValueKind.Array)
            return null;

        var parts = new List<string>();
        foreach (var item in content.EnumerateArray())
        {
            if (item.TryGetProperty("type", out var type) && type.ValueKind == JsonValueKind.String && type.GetString() != "text")
                continue;

            if (item.TryGetProperty("text", out var textElement) && textElement.ValueKind == JsonValueKind.String)
                parts.Add(textElement.GetString() ?? string.Empty);
        }

        return string.Concat(parts);
    }

    private sealed record UpdateAiSettingsRequest(string BaseUrl, string Model, bool IsEnabled, string? ApiKey, bool ClearApiKey = false);
    private sealed record AiStyleRequest(string Text);

    private sealed record AiStyleResult(bool IsSuccess, string? StyledText, string? ErrorMessage)
    {
        public static AiStyleResult Success(string styledText) => new(true, styledText, null);
        public static AiStyleResult Failure(string errorMessage) => new(false, null, errorMessage);
    }
}
