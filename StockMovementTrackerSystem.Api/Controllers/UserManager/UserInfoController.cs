using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockMovementTrackerSystem.Api.Helper;
using StockMovementTrackerSystem.Application.Models;
using StockMovementTrackerSystem.Domain.Entities;
using StockMovementTrackerSystem.Infrastructure.Persistence;

namespace ES_LAB.Server.Controllers.UserManage;

[Authorize]
[Route("api/user/[controller]")]
[ApiController]
public class UserInfoController(
    StockMovementTrackerSystemDbContext context,
    UserManager<IdentityUser> userManager) : ControllerBase
{

    [HttpGet("get-role")]
    [EndpointSummary("Role")]
    [EndpointDescription("Fetches user information based on the specified role, allowing retrieval of users with a specific role such as Admin or Cashier.")]
    [ProducesResponseType(typeof(DefaultResponseModel<List<ViUserInformation>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAsync(string role)
    {
        return ResponseHelper.Ok_Result(await context.ViUserInformations.Where(x => x.Name == role).ToListAsync(), null);
    }

    [HttpGet("by-username")]
    [EndpointSummary("Check-User name")]
    [EndpointDescription("Checks if a user with the specified username already exists, allowing validation of username availability during user creation or updates.")]
    public async Task<IActionResult> CheckByEmpUserName(string userName)
    {
        bool isExist = await context.AspNetUsers.AnyAsync(x => x.UserName == userName);

        return Ok(new
        {
            success = !isExist,
            message = isExist ? "UserName already exists" : null
        });
    }

    [HttpPost]
    [EndpointSummary("Create")]
    [EndpointDescription("Creates a new user with the provided information, including username, email, phone number, role, and other details. This endpoint allows for the creation of user accounts and assigns them to specific roles.")]
    [ProducesResponseType(typeof(DefaultResponseModel<List<UserInformation>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> PostAsync(UserInfoEntryModel model)
    {
        if (string.IsNullOrWhiteSpace(model.Password))
        {
            return ResponseHelper.Bad_Request(null, new DefaultResponseMessageModel(
                "Password is required when creating a user.",
                "အသုံးပြုသူအသစ်ဖန်တီးရန် စကားဝှက်လိုအပ်ပါသည်။"));
        }

        IdentityUser user = new()
        {
            UserName = model.UserName,
            Email = model.Email,
            EmailConfirmed = !string.IsNullOrEmpty(model.Email),
            PhoneNumber = model.PhoneNumber,
            PhoneNumberConfirmed = !string.IsNullOrEmpty(model.PhoneNumber),
            SecurityStamp = Guid.NewGuid().ToString(),
        };
        IdentityResult result = await userManager.CreateAsync(user, model.Password);
        if (!result.Succeeded)
        {
            string errors = string.Join("; ", result.Errors.Select(e => e.Description));
            return ResponseHelper.Bad_Request(null, new DefaultResponseMessageModel("Unable to create User: " + errors, ""));
        }

        IdentityResult setRole = await userManager.AddToRoleAsync(user, model.RoleName);

        if (setRole.Succeeded)
        {
            UserInformation userInfo = new UserInformation()
            {
                UserId = user.Id,
                FullName = model.FullName,
                Address = model.Address,
                Status = model.Status,
                CreatedOn = DateTime.Now,
                CreatedBy = User?.Identity?.Name ?? "",
            };
            context.UserInformations.Add(userInfo);
        }
        else
        {
            return ResponseHelper.Bad_Request(null, new DefaultResponseMessageModel("Unable to create User.", ""));
        }

        await context.SaveChangesAsync();

        return ResponseHelper.Created_Result("api/user/userInfo/create", null, new DefaultResponseMessageModel("User created successfully.", ""));
    }

    [HttpPut]
    [EndpointSummary("Update")]
    [EndpointDescription("Updates existing user information based on the provided details, allowing modifications to user attributes such as username, email, phone number, role, and other relevant information. This endpoint facilitates the management and maintenance of user accounts by enabling updates to their information.")]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateAsync(UserInfoEntryModel model)
    {
        UserInformation? userInfo = await context.UserInformations.FirstOrDefaultAsync(x => x.UserId == model.UserId);
        IdentityUser? user = await userManager.FindByIdAsync(model.UserId);
        if (userInfo == null || user == null)
        {
            return ResponseHelper.NotFound_Request(null, new DefaultResponseMessageModel()
            {
                EN = "User Info data not found!",
                MM = "User Info အချက်အလက် ရှာမတွေ့ပါ။"
            });
        }

        user.UserName = model.UserName;
        user.Email = model.Email;
        user.EmailConfirmed = !string.IsNullOrEmpty(model.Email);
        user.PhoneNumber = model.PhoneNumber;
        user.PhoneNumberConfirmed = !string.IsNullOrEmpty(model.PhoneNumber);

        IdentityResult result = await userManager.UpdateAsync(user);

        if (result.Succeeded)
        {
            userInfo.FullName = model.FullName;
            userInfo.Address = model.Address;
            userInfo.Status = model.Status;
            userInfo.TerminateDate = model.TerminateDate;
            userInfo.CreatedOn = model.CreatedOn;
            userInfo.CreatedBy = model.CreatedBy;
            userInfo.UpdatedOn = DateTime.Now;
            userInfo.UpdatedBy = User?.Identity?.Name ?? "Unknow";
        }
        context.UserInformations.Update(userInfo);
        return await context.SaveChangesAsync() > 0
            ? ResponseHelper.Ok_Result(null, new DefaultResponseMessageModel()
            {
                EN = "User Info data have been updated!",
                MM = "User Info အချက်အလက် ပြင်ပြီးပါပြီ။"
            })
            : ResponseHelper.Bad_Request(null, new DefaultResponseMessageModel()
            {
                EN = "User Info data cannot update!",
                MM = "User Info အချက်အလက် ပြင်၍မရပါ။"
            });
    }

    [HttpPut("reset")]
    [EndpointSummary("Reset Password")]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetPassword(string userName, string password)
    {
        IdentityUser? user = await userManager.FindByNameAsync(userName);
        if (user == null)
        {
            return ResponseHelper.NotFound_Request(null, new DefaultResponseMessageModel
            {
                EN = "User Not Found.",
                MM = "User မတွေ့ပါ။"
            });
        }

        user.PasswordHash = userManager.PasswordHasher.HashPassword(user, password);
        IdentityResult result = await userManager.UpdateAsync(user);

        return result.Succeeded
            ? ResponseHelper.Ok_Result(null, new DefaultResponseMessageModel
            {
                EN = "Password reset successfully.",
                MM = "စကားဝှက် ပြောင်းလဲပြီးပါပြီ။"
            })
            : ResponseHelper.Bad_Request(null, new DefaultResponseMessageModel
            {
                EN = "Unable to reset password.",
                MM = "စကားဝှက် ပြောင်းလဲ၍မရပါ။"
            });
    }


    [HttpPut("terminate")]
    [EndpointSummary("Terminated")]
    [EndpointDescription("Updates the termination status of a user based on the provided user ID and status, allowing for the management of user accounts by marking them as terminated or active. This endpoint facilitates the control of user access and account status within the system.")]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> TermianteChangeAsync(string userId)
    {
        UserInformation? userInfo = await context.UserInformations.FindAsync(userId);
        if (userInfo == null)
        {
            return ResponseHelper.NotFound_Request(null, new DefaultResponseMessageModel()
            {
                EN = "User Info not found",
                MM = ""
            });
        }

        userInfo.Status = false;

        userInfo.TerminateDate = DateTime.Now;
        userInfo.UpdatedOn = DateTime.Now;
        userInfo.UpdatedBy = User.Identity?.Name ?? "";

        context.UserInformations.Update(userInfo);

        return await context.SaveChangesAsync() > 0
            ? ResponseHelper.Ok_Result(null, new DefaultResponseMessageModel()
            {
                EN = "Terminate status updated!",
                MM = ""
            })
            : ResponseHelper.Bad_Request(null, new DefaultResponseMessageModel()
            {
                EN = "Terminate cannot be updated!",
                MM = ""
            });
    }

    [HttpPut("unterminate")]
    [EndpointSummary("UnTerminated")]
    [EndpointDescription("Updates the Untermination status of a user based on the provided user ID and status, allowing for the management of user accounts by marking them as terminated or active. This endpoint facilitates the control of user access and account status within the system.")]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DefaultResponseModel), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UnTermianteChangeAsync(string userId)
    {
        UserInformation? userInfo = await context.UserInformations.FindAsync(userId);
        if (userInfo == null)
        {
            return ResponseHelper.NotFound_Request(null, new DefaultResponseMessageModel()
            {
                EN = "User Info not found",
                MM = ""
            });
        }

        userInfo.TerminateDate = null;
        userInfo.Status = true;
        userInfo.UpdatedOn = DateTime.Now;
        userInfo.UpdatedBy = User.Identity?.Name ?? "";

        context.UserInformations.Update(userInfo);

        return await context.SaveChangesAsync() > 0
            ? ResponseHelper.Ok_Result(null, new DefaultResponseMessageModel()
            {
                EN = "Terminate status updated!",
                MM = ""
            })
            : ResponseHelper.Bad_Request(null, new DefaultResponseMessageModel()
            {
                EN = "Terminate cannot be updated!",
                MM = ""
            });
    }
}
