
using Microsoft.Extensions.Configuration;
using StockMovementTrackerSystem.Application.Models.AI_Model;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace StockMovementTrackerSystem.Infrastructure.Services;

public sealed class OpenRouterChatService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public OpenRouterChatService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;

        _httpClient.BaseAddress =
            new Uri("https://openrouter.ai/api/v1/");
    }

    public async Task<ChatResponse> AskAsync(
        string message,
        CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["AI:ApiKey"] ?? _configuration["OpenRouter:ApiKey"];
        var model = _configuration["AI:Model"] ?? _configuration["OpenRouter:Model"] ?? "google/gemini-2.0-flash-exp:free";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException(
                "AI API key is not configured.");
        }

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            "chat/completions");

        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        request.Content = JsonContent.Create(
            new OpenRouterRequest
            {
                Model = model,
                Messages =
                [
                    new OpenRouterMessage
                    {
                        Role = "system",
                        Content =
                            "You are a helpful assistant for a stock " +
                            "movement management system. Explain clearly. " +
                            "If you do not know a fact, say so."
                    },
                    new OpenRouterMessage
                    {
                        Role = "user",
                        Content = message
                    }
                ]
            });

        using var response = await _httpClient.SendAsync(
            request,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"OpenRouter returned HTTP status " +
                $"{(int)response.StatusCode}.");
        }

        var result =
            await response.Content.ReadFromJsonAsync<OpenRouterResponse>(
                cancellationToken: cancellationToken);

        var answer = result?.Choices?.FirstOrDefault()
            ?.Message?.Content;

        if (string.IsNullOrWhiteSpace(answer))
        {
            throw new InvalidOperationException(
                "AI returned an empty response.");
        }

        return new ChatResponse
        {
            Answer = answer
        };
    }

    private sealed class OpenRouterRequest
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        [JsonPropertyName("messages")]
        public List<OpenRouterMessage> Messages { get; set; } = [];
    }

    private sealed class OpenRouterMessage
    {
        [JsonPropertyName("role")]
        public string Role { get; set; } = string.Empty;

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }

    private sealed class OpenRouterResponse
    {
        [JsonPropertyName("choices")]
        public List<OpenRouterChoice> Choices { get; set; } = [];
    }

    private sealed class OpenRouterChoice
    {
        [JsonPropertyName("message")]
        public OpenRouterMessage? Message { get; set; }
    }
}
