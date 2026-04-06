using System.Text.Json;
using FluentAssertions;
using WikiWeaver.Application.Services;

namespace WikiWeaver.Application.Tests;

public class AdminServiceUtilityTests
{
    #region BuildChatCompletionsEndpoint

    [Fact]
    public void BuildChatCompletionsEndpoint_UrlEndingWithV1_AppendsPathOnly()
    {
        var result = AdminService.BuildChatCompletionsEndpoint("https://api.openai.com/v1");

        result.Should().Be("https://api.openai.com/v1/chat/completions");
    }

    [Fact]
    public void BuildChatCompletionsEndpoint_UrlWithoutV1_PrependsV1()
    {
        var result = AdminService.BuildChatCompletionsEndpoint("https://custom-api.example.com");

        result.Should().Be("https://custom-api.example.com/v1/chat/completions");
    }

    [Fact]
    public void BuildChatCompletionsEndpoint_UrlWithTrailingSlash_TrimsSlash()
    {
        var result = AdminService.BuildChatCompletionsEndpoint("https://api.openai.com/v1/");

        result.Should().Be("https://api.openai.com/v1/chat/completions");
    }

    #endregion

    #region ExtractProviderErrorMessage

    [Fact]
    public void ExtractProviderErrorMessage_EmptyString_ReturnsDefault()
    {
        var result = AdminService.ExtractProviderErrorMessage("");

        result.Should().Be("empty provider response");
    }

    [Fact]
    public void ExtractProviderErrorMessage_NestedErrorMessage_ExtractsMessage()
    {
        var json = """{"error":{"message":"Invalid API key","type":"invalid_request_error"}}""";

        var result = AdminService.ExtractProviderErrorMessage(json);

        result.Should().Be("Invalid API key");
    }

    [Fact]
    public void ExtractProviderErrorMessage_ErrorAsString_ReturnsString()
    {
        var json = """{"error":"Rate limit exceeded"}""";

        var result = AdminService.ExtractProviderErrorMessage(json);

        result.Should().Be("Rate limit exceeded");
    }

    [Fact]
    public void ExtractProviderErrorMessage_RootMessage_ExtractsMessage()
    {
        var json = """{"message":"Service unavailable"}""";

        var result = AdminService.ExtractProviderErrorMessage(json);

        result.Should().Be("Service unavailable");
    }

    [Fact]
    public void ExtractProviderErrorMessage_PlainText_ReturnsAsIs()
    {
        var result = AdminService.ExtractProviderErrorMessage("Internal Server Error");

        result.Should().Be("Internal Server Error");
    }

    [Fact]
    public void ExtractProviderErrorMessage_LongText_TruncatesTo400Chars()
    {
        var longText = new string('x', 500);

        var result = AdminService.ExtractProviderErrorMessage(longText);

        result.Should().HaveLength(400);
    }

    #endregion

    #region TryExtractContent

    [Fact]
    public void TryExtractContent_StringContent_ReturnsContent()
    {
        var json = JsonDocument.Parse("""
            {
                "choices": [
                    {
                        "message": {
                            "content": "Hello, world!"
                        }
                    }
                ]
            }
        """);

        var result = AdminService.TryExtractContent(json.RootElement);

        result.Should().Be("Hello, world!");
    }

    [Fact]
    public void TryExtractContent_ArrayContent_ConcatenatesTextParts()
    {
        var json = JsonDocument.Parse("""
            {
                "choices": [
                    {
                        "message": {
                            "content": [
                                {"type": "text", "text": "Part 1"},
                                {"type": "image_url", "image_url": {}},
                                {"type": "text", "text": "Part 2"}
                            ]
                        }
                    }
                ]
            }
        """);

        var result = AdminService.TryExtractContent(json.RootElement);

        result.Should().Be("Part 1Part 2");
    }

    [Fact]
    public void TryExtractContent_NoChoices_ReturnsNull()
    {
        var json = JsonDocument.Parse("""{"id": "123"}""");

        var result = AdminService.TryExtractContent(json.RootElement);

        result.Should().BeNull();
    }

    [Fact]
    public void TryExtractContent_EmptyChoicesArray_ReturnsNull()
    {
        var json = JsonDocument.Parse("""{"choices": []}""");

        var result = AdminService.TryExtractContent(json.RootElement);

        result.Should().BeNull();
    }

    #endregion
}
