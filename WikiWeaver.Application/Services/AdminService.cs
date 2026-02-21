using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WikiWeaver.Application.Configuration;
using WikiWeaver.Application.DTOs;
using WikiWeaver.Application.Resources;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Data;

namespace WikiWeaver.Application.Services
{
    public class AdminService
    {
        private readonly WikiWeaverDbContext _dbContext;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<AdminService> _logger;
        private readonly AdminAiOptions _aiOptions;

        public AdminService(
            WikiWeaverDbContext dbContext,
            IHttpClientFactory httpClientFactory,
            IOptions<AdminOptions> adminOptions,
            ILogger<AdminService> logger)
        {
            _dbContext = dbContext;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _aiOptions = adminOptions.Value.Ai;
        }

        public async Task<AdminCleanupResultDto> CleanupDemoDataAsync(CancellationToken cancellationToken = default)
        {
            var nodeCount = await _dbContext.Nodes.CountAsync(cancellationToken);
            var articleCount = await _dbContext.Articles.CountAsync(cancellationToken);
            var paragraphCount = await _dbContext.Paragraphs.CountAsync(cancellationToken);

            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

            await _dbContext.Nodes
                .Where(node => node.ParentId.HasValue || node.ArticleId.HasValue)
                .ExecuteUpdateAsync(
                    setters => setters
                        .SetProperty(node => node.ParentId, node => null)
                        .SetProperty(node => node.ArticleId, node => null),
                    cancellationToken);

            await _dbContext.Paragraphs.ExecuteDeleteAsync(cancellationToken);
            await _dbContext.Articles.ExecuteDeleteAsync(cancellationToken);
            await _dbContext.Nodes.ExecuteDeleteAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            _logger.LogWarning(
                "Public admin cleanup executed. Deleted Nodes: {NodeCount}, Articles: {ArticleCount}, Paragraphs: {ParagraphCount}",
                nodeCount,
                articleCount,
                paragraphCount);

            return new AdminCleanupResultDto
            {
                DeletedNodes = nodeCount,
                DeletedArticles = articleCount,
                DeletedParagraphs = paragraphCount,
                Message = "Cleanup completed"
            };
        }

        public async Task<AiProviderSettingsDto> GetAiSettingsAsync(CancellationToken cancellationToken = default)
        {
            var settings = await GetOrCreateAiSettingsAsync(cancellationToken);
            return ToResponse(settings);
        }

        public async Task<ServiceResult<AiProviderSettingsDto>> UpdateAiSettingsAsync(
            UpdateAiProviderSettingsDto request,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(request.BaseUrl) || string.IsNullOrWhiteSpace(request.Model))
            {
                return ServiceResult<AiProviderSettingsDto>.Failure(AdminMessages.BaseUrlAndModelRequiredMessage);
            }

            var settings = await GetOrCreateAiSettingsAsync(cancellationToken);
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

            await _dbContext.SaveChangesAsync(cancellationToken);
            return ServiceResult<AiProviderSettingsDto>.Success(ToResponse(settings));
        }

        public async Task<ServiceResult<AiStyleResponseDto>> StyleMarkdownAsync(string text, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return ServiceResult<AiStyleResponseDto>.Failure(AdminMessages.TextRequiredMessage);
            }

            var settings = await GetOrCreateAiSettingsAsync(cancellationToken);
            var styleResult = await TryStyleTextWithProviderAsync(text, settings, cancellationToken);

            if (!styleResult.IsSuccess)
            {
                return ServiceResult<AiStyleResponseDto>.Failure(styleResult.ErrorMessage);
            }

            return ServiceResult<AiStyleResponseDto>.Success(new AiStyleResponseDto
            {
                StyledText = styleResult.StyledText
            });
        }

        public async Task<ServiceResult<AiConnectionCheckResultDto>> CheckAiConnectionAsync(CancellationToken cancellationToken = default)
        {
            var settings = await GetOrCreateAiSettingsAsync(cancellationToken);
            var styleResult = await TryStyleTextWithProviderAsync(AdminMessages.AiConnectionTestText, settings, cancellationToken);

            if (!styleResult.IsSuccess)
            {
                return ServiceResult<AiConnectionCheckResultDto>.Failure(styleResult.ErrorMessage);
            }

            return ServiceResult<AiConnectionCheckResultDto>.Success(new AiConnectionCheckResultDto
            {
                Message = AdminMessages.ConnectionSuccessMessage,
                StyledText = styleResult.StyledText
            });
        }

        private async Task<AiStyleResult> TryStyleTextWithProviderAsync(
            string text,
            AiProviderSettings settings,
            CancellationToken cancellationToken)
        {
            if (!settings.IsEnabled)
            {
                return AiStyleResult.Failure(AdminMessages.AiDisabledMessage);
            }

            if (string.IsNullOrWhiteSpace(settings.ApiKey))
            {
                return AiStyleResult.Failure(AdminMessages.ApiKeyRequiredMessage);
            }

            var payload = new
            {
                model = settings.Model,
                temperature = _aiOptions.Temperature,
                messages = new object[]
                {
                    new { role = "system", content = ResolveMarkdownPrompt() },
                    new { role = "user", content = text }
                }
            };

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiKey);

            var endpoint = BuildChatCompletionsEndpoint(settings.BaseUrl);
            using var response = await client.PostAsJsonAsync(endpoint, payload, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning(
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
                return AiStyleResult.Failure(AdminMessages.EmptyProviderResponseMessage);
            }

            return AiStyleResult.Success(styledText);
        }

        private string ResolveMarkdownPrompt()
        {
            return string.IsNullOrWhiteSpace(_aiOptions.MarkdownStylingSystemPrompt)
                ? AdminMessages.DefaultMarkdownStylingSystemPrompt
                : _aiOptions.MarkdownStylingSystemPrompt;
        }

        private async Task<AiProviderSettings> GetOrCreateAiSettingsAsync(CancellationToken cancellationToken)
        {
            var settings = await _dbContext.AiProviderSettings.FirstOrDefaultAsync(cancellationToken);
            if (settings is not null)
            {
                return settings;
            }

            settings = new AiProviderSettings();
            _dbContext.AiProviderSettings.Add(settings);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return settings;
        }

        private static AiProviderSettingsDto ToResponse(AiProviderSettings settings)
        {
            return new AiProviderSettingsDto
            {
                BaseUrl = settings.BaseUrl,
                Model = settings.Model,
                IsEnabled = settings.IsEnabled,
                HasApiKey = !string.IsNullOrWhiteSpace(settings.ApiKey)
            };
        }

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
            {
                return "empty provider response";
            }

            try
            {
                using var document = JsonDocument.Parse(rawError);
                var root = document.RootElement;

                if (root.TryGetProperty("error", out var errorElement))
                {
                    if (errorElement.ValueKind == JsonValueKind.String)
                    {
                        return errorElement.GetString() ?? "provider error";
                    }

                    if (errorElement.TryGetProperty("message", out var messageElement) && messageElement.ValueKind == JsonValueKind.String)
                    {
                        return messageElement.GetString() ?? "provider error";
                    }
                }

                if (root.TryGetProperty("message", out var rootMessage) && rootMessage.ValueKind == JsonValueKind.String)
                {
                    return rootMessage.GetString() ?? "provider error";
                }
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
            {
                return null;
            }

            var firstChoice = choices[0];
            if (!firstChoice.TryGetProperty("message", out var message) || !message.TryGetProperty("content", out var content))
            {
                return null;
            }

            if (content.ValueKind == JsonValueKind.String)
            {
                return content.GetString();
            }

            if (content.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            var parts = new List<string>();
            foreach (var item in content.EnumerateArray())
            {
                if (item.TryGetProperty("type", out var type) && type.ValueKind == JsonValueKind.String && type.GetString() != "text")
                {
                    continue;
                }

                if (item.TryGetProperty("text", out var textElement) && textElement.ValueKind == JsonValueKind.String)
                {
                    parts.Add(textElement.GetString() ?? string.Empty);
                }
            }

            return string.Concat(parts);
        }

        public sealed record ServiceResult<T>(bool IsSuccess, T? Value, string? ErrorMessage)
        {
            public static ServiceResult<T> Success(T value) => new(true, value, null);
            public static ServiceResult<T> Failure(string errorMessage) => new(false, default, errorMessage);
        }

        private sealed record AiStyleResult(bool IsSuccess, string? StyledText, string? ErrorMessage)
        {
            public static AiStyleResult Success(string styledText) => new(true, styledText, null);
            public static AiStyleResult Failure(string errorMessage) => new(false, null, errorMessage);
        }
    }
}
