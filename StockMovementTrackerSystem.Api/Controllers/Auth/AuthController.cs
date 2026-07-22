using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockMovementTrackerSystem.Api.Helper;
using StockMovementTrackerSystem.Application.Interfaces;
using StockMovementTrackerSystem.Application.Models;
using StockMovementTrackerSystem.Domain.Entities;
using StockMovementTrackerSystem.Infrastructure.Persistence;
using System.Security.Claims;

namespace StockMovementTrackerSystem.Api.Controllers.Auth;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class AuthController(
    UserManager<IdentityUser> userManager,
    ILogger<AuthController> logger,
    ITokenBuilder tokenBuilder,
    StockMovementTrackerSystemDbContext context
    ) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    [EndpointSummary("Access Token")]
    [EndpointDescription("""Generates an access token for the requested user. ... """)]
    [Produces("application/json")]
    [ProducesResponseType(typeof(LoginModel),StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> AccessToken([FromBody] LoginModel model)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return ResponseHelper.Bad_Request(null, new DefaultResponseMessageModel("Please fill data.", ""));
            }

            var user = await userManager.FindByNameAsync(model.Username) ??
                await userManager.FindByEmailAsync(model.Username);

            if (user == null)
            {
                return ResponseHelper.NotFound_Request(null, new DefaultResponseMessageModel("Invalid username or invalid email. User not found.", ""));
            }

            if(await userManager.CheckPasswordAsync(user, model.Password))
            {
                if(user.UserName?.ToLower() != "")
                {
                    var userInfo = await context.UserInformations.FindAsync(user.Id);
                    if(userInfo !=null && userInfo.TerminateDate != null)
                    {
                        logger.LogWarning("Login failed: User account is terminated. [UserId:{Id}]", user.Id);
                        return ResponseHelper.Unauthorized_Request(null,
                            new DefaultResponseMessageModel("Your account has been terminated. Please contact admin.",""));
                    }
                }

                var roles = await userManager.GetRolesAsync(user);
                string role = roles.FirstOrDefault() ?? string.Empty;

                DateTime expiry = DateTime.Now.AddDays(1);
                DateTime refreshTokenExpiry = DateTime.Now.AddDays(30);
                string accessToken = tokenBuilder.GenerateAccessToken(user, role, expiry);
                string refreshToken = tokenBuilder.GenerateRefreshToken();

                var tokenClaim = await context.TokenClaims.FindAsync(user.Id);
                if(tokenClaim != null)
                {
                    tokenClaim.AccessToken = accessToken;
                    tokenClaim.RefreshToken = refreshToken;
                    tokenClaim.TokenExpiry = refreshTokenExpiry;
                    context.TokenClaims.Update(tokenClaim);
                }
                else
                {
                    TokenClaim newTokenClaim = new()
                    {
                        UserId = user.Id,
                        RefreshDate = DateTime.Now,
                        AccessToken = accessToken,
                        RefreshToken = refreshToken,
                        TokenExpiry = refreshTokenExpiry
                    };
                    context.TokenClaims.Add(newTokenClaim);
                }
                await context.SaveChangesAsync();

                logger.LogInformation("Access token generated! [UserId:{id}] [UserName:{username}]", user.Id, user.UserName);

                return ResponseHelper.Ok_Result(
                    new
                    {
                        access_token = accessToken,
                        refresh_token = refreshToken,
                        expiration = 30,
                        user = new { user.Id, user.UserName, user.Email, user.PhoneNumber, user_role = role.ToLower() }
                    },
                    new DefaultResponseMessageModel("Successfully generated access token.", "")
                    );
            }
            logger.LogInformation("Unauthorized request [UserId:{id}] [UserName:{username}]", user.Id, user.UserName);
            return ResponseHelper.Unauthorized_Request(null, new DefaultResponseMessageModel("The username or password is invalid. Please try again.", ""));
        }
        catch(Exception ex)
        {
            var innerMessage = ex.InnerException != null ? ex.InnerException.Message : "No inner exception";
            logger.LogError("Error: {message} | InnerError: {inner}", ex.Message, innerMessage);
            //logger.LogError("Error: {message}", ex.Message);
            return ResponseHelper.InternalServerError_Request(null, new DefaultResponseMessageModel("Error: " + ex.Message, ""));
        }
    }

    [AllowAnonymous]
    [HttpPost("change-password")]
    [EndpointSummary("Change Password")]
    [EndpointDescription("Changes a user's password after verifying the current password.")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return ResponseHelper.Bad_Request(null,
                    new DefaultResponseMessageModel("Please fill all password fields.", ""));
            }

            if (!string.Equals(model.NewPassword, model.ConfirmPassword, StringComparison.Ordinal))
            {
                return ResponseHelper.Bad_Request(null,
                    new DefaultResponseMessageModel("New password and confirm password do not match.", ""));
            }

            if (string.Equals(model.OldPassword, model.NewPassword, StringComparison.Ordinal))
            {
                return ResponseHelper.Bad_Request(null,
                    new DefaultResponseMessageModel("New password must be different from the old password.", ""));
            }

            string username = model.UserName.Trim();
            IdentityUser? user = await userManager.FindByNameAsync(username) ??
                                 await userManager.FindByEmailAsync(username);

            if (user == null)
            {
                return ResponseHelper.Unauthorized_Request(null,
                    new DefaultResponseMessageModel("The username or old password is invalid.", ""));
            }

            IdentityResult result = await userManager.ChangePasswordAsync(
                user,
                model.OldPassword,
                model.NewPassword);

            if (!result.Succeeded)
            {
                bool invalidOldPassword = result.Errors.Any(error =>
                    error.Code.Equals("PasswordMismatch", StringComparison.OrdinalIgnoreCase));

                string message = invalidOldPassword
                    ? "The username or old password is invalid."
                    : string.Join(" ", result.Errors.Select(error => error.Description));

                logger.LogWarning("Password change failed. [UserId:{Id}] [Errors:{Errors}]",
                    user.Id,
                    string.Join(", ", result.Errors.Select(error => error.Code)));

                return invalidOldPassword
                    ? ResponseHelper.Unauthorized_Request(null, new DefaultResponseMessageModel(message, ""))
                    : ResponseHelper.Bad_Request(null, new DefaultResponseMessageModel(message, ""));
            }

            logger.LogInformation("Password changed successfully. [UserId:{Id}] [UserName:{Username}]",
                user.Id,
                user.UserName);

            return ResponseHelper.Ok_Result(null,
                new DefaultResponseMessageModel(
                    "Password changed successfully. You can now sign in with your new password.",
                    ""));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error while changing password.");
            return ResponseHelper.InternalServerError_Request(null,
                new DefaultResponseMessageModel("Unable to change password. Please try again.", ""));
        }
    }

    [AllowAnonymous]
    [HttpPost("refresh-token")]
    [EndpointSummary("Refresh Token")]
    [EndpointDescription("""
                         Generates a new access token and refresh token for the requesting user who has a valid previous refresh token. </br>
                         This new refresh token will be valid for 30 days, while the new access token will be valid for 1 day.
                         """)]
    [Produces("application/json")]
    [ProducesResponseType(typeof(LoginModel), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenModel model)
    {
        try
        {
            string accessToken = model.Access_Token;
            string refreshToken = model.Refresh_Token;

            var principal = tokenBuilder.GetPrincipalFromExpiredToken(accessToken);

            var user = await userManager.FindByNameAsync(principal.Identity?.Name ?? "");
            if (user == null)
            {
                return ResponseHelper.NotFound_Request(null, new DefaultResponseMessageModel("User not found.", ""));
            }

            var tokenClaim = await context.TokenClaims.FirstOrDefaultAsync(x => x.RefreshToken == refreshToken);
            if(tokenClaim == null || tokenClaim.RefreshToken !=refreshToken || tokenClaim.TokenExpiry <= DateTime.Now)
            {
                logger.LogDebug("Unauthorized Refresh Token [Token:{Token}]", refreshToken);
                return ResponseHelper.Unauthorized_Request(null,
                    new DefaultResponseMessageModel("Invalid refresh token or refresh token has expired.", ""));
            }

            // Generate new tokens
            DateTime expiry = DateTime.Now.AddDays(1);
            DateTime refreshTokenExpiry = DateTime.Now.AddDays(30);

            var roles = await userManager.GetRolesAsync(user);
            string newAccessToken = tokenBuilder.GenerateAccessToken(user, roles.FirstOrDefault() ?? string.Empty, expiry);
            string newRefreshToken = tokenBuilder.GenerateRefreshToken();

            // Update token claim
            tokenClaim.RefreshDate = DateTime.Now;
            tokenClaim.AccessToken = newAccessToken;
            tokenClaim.RefreshToken = newRefreshToken;
            tokenClaim.TokenExpiry = refreshTokenExpiry;

            context.TokenClaims.Update(tokenClaim);
            await context.SaveChangesAsync();

            logger.LogDebug("New Refresh Token generated! [RefreshToken:{Refresh_Token}]", newRefreshToken);

            return ResponseHelper.Ok_Result(
                new
                {
                    access_token = newAccessToken,
                    refresh_token = newRefreshToken,
                    expiration = 30,
                    user = new
                    {
                        user.Id,
                        user.Email,
                        user.UserName,
                        user.PhoneNumber,
                        user_role = roles.FirstOrDefault()?.ToLower()
                    }
                },
                new DefaultResponseMessageModel("Successfully generated new refresh token.", ""));
        }
        catch (Exception exp)
        {
            // Log the error
            logger.LogError("Error: {message}", exp.Message);

            return ResponseHelper.InternalServerError_Request(null,
                new DefaultResponseMessageModel("Error: " + exp.Message, ""));
        }
    }
    [HttpPost("revoke-token/{username}")]
    [EndpointSummary("Revoke Token")]
    [EndpointDescription("Revoking token for the specified user. This will log out the user from the current device.")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Revoke(string username)
    {
        try
        {
            IdentityUser? user = await userManager.FindByNameAsync(username);
            if (user == null)
            {
                return ResponseHelper.NotFound_Request(null, new DefaultResponseMessageModel("User not found.", ""));
            }

            TokenClaim? tokenClaim = await context.TokenClaims.FindAsync(user.Id);
            if (tokenClaim != null)
            {
                tokenClaim.RefreshDate = DateTime.Now;
                tokenClaim.AccessToken = null;
                tokenClaim.RefreshToken = null;
                tokenClaim.TokenExpiry = null;
                context.TokenClaims.Update(tokenClaim);

                await context.SaveChangesAsync();
            }

            logger.LogDebug("Revoke Token successfully! [UserId:{UserId}]", user.Id);
            return ResponseHelper.Ok_Result(new
            {
                user = new
                {
                    user.Id,
                    user.UserName,
                    user.Email,
                    user.PhoneNumber,
                    user_role = string.Empty
                }
            },
                new DefaultResponseMessageModel("Token revoked successfully.", ""));
        }
        catch (Exception exp)
        {
            // Log the error
            logger.LogError("Error: {message}", exp.Message);
            return ResponseHelper.InternalServerError_Request(null,
                new DefaultResponseMessageModel("Error: " + exp.Message, ""));
        }
    }

    /// <summary>
    /// Status
    /// </summary>
    /// <returns></returns>
    [HttpGet("status")]
    [EndpointSummary("Authorize Status")]
    [EndpointDescription("Check if the user is authorized or not. This endpoint can be used to verify the validity of the access token.")]
    public IActionResult StatusAsync()
    {
        return (User.Identity != null)
            ? ResponseHelper.Ok_Result(null, new DefaultResponseMessageModel("Authorized.", ""))
            : ResponseHelper.Bad_Request(null, new DefaultResponseMessageModel("Unauthorized.", ""));
    }

    /// <summary>
    /// Claims
    /// </summary>
    /// <returns></returns>
    [HttpPost("claims")]
    [EndpointSummary("User Claims")]
    [EndpointDescription("Add a claim to the currently authenticated user. This can be used to assign specific permissions or roles to the user.")]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateClaim()
    {
        IdentityUser? user = await userManager.FindByNameAsync(User.Identity?.Name ?? string.Empty);
        if (user == null)
        {
            return ResponseHelper.NotFound_Request(null, new DefaultResponseMessageModel("User not found", ""));
        }

        await userManager.AddClaimAsync(user, new Claim("Master_Read", "Branch"));
        return ResponseHelper.Ok_Result(null, new DefaultResponseMessageModel("Successfully Created", ""));
    }

    [HttpGet("all")]
    [EndpointSummary("List")]
    [EndpointDescription("Fetches a list of all users in the system along with their associated roles. This endpoint is useful for administrative purposes, allowing administrators to view and manage user accounts and their roles.")]
    public async Task<IActionResult> GetAllUser()
    {
        List<IdentityUser> users = await userManager.Users.ToListAsync();
        List<object> userList = [];
        foreach (var user in users)
        {
            IList<string> roles = await userManager.GetRolesAsync(user);
            userList.Add(new
            {
                user.Id,
                user.UserName,
                user.Email,
                user.PhoneNumber,
                user_role = roles.FirstOrDefault()?.ToLower() ?? string.Empty
            });
        }

        return ResponseHelper.Ok_Result(userList, new DefaultResponseMessageModel("Users fetched successfully.", ""));
    }
}
