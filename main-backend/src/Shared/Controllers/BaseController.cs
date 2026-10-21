using Microsoft.AspNetCore.Mvc;
using dotnet.Shared.Common;

namespace dotnet.Shared.Controllers;

[ApiController]
public class BaseController : ControllerBase
{
    protected int? CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(idClaim, out var id) ? id : null;
        }
    }

    protected string? CurrentUserEmail =>
        User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

    protected string? CurrentSystemRoleSlug =>
        User.FindFirst(AppClaimTypes.SystemRole)?.Value;

    protected string? CurrentRoleSlug =>
        User.FindFirst(AppClaimTypes.Role)?.Value;

    protected bool HasSystemRole(string slug) =>
        string.Equals(CurrentSystemRoleSlug, slug, StringComparison.OrdinalIgnoreCase);
}