using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StockMovementTrackerSystem.Api.Helper;
using StockMovementTrackerSystem.Application.Interfaces.Services;
using StockMovementTrackerSystem.Application.Models.Chat;

namespace StockMovementTrackerSystem.Api.Controllers.AIChatBot;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpGet]
    public async Task<IActionResult> GetConversations()
    {
        var response = await _chatService.GetConversationsAsync();
        return ResponseHelper.Ok_Result(response, null);
    }

    [HttpGet("{conversationId:guid}")]
    public async Task<IActionResult> GetConversation(Guid conversationId)
    {
        var response = await _chatService.GetConversationAsync(conversationId);
        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> Chat(ChatRequestModel request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new
            {
                message = "Message is required."
            });
        }
        var response = await _chatService.SendMessageAsync(request);
        return Ok(response);
    }

    [HttpDelete("{conversationId:guid}")]
    public async Task<IActionResult> DeleteConversation(Guid conversationId)
    {
        await _chatService.DeleteConversationAsync(conversationId);
        return NoContent();
    }
}
