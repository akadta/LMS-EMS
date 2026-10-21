using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Shared.Services;
using dotnet.UserAdminApi.Dtos;
using dotnet.Data;

namespace dotnet.UserAdminApi.Controllers;

[Route("api/user/login")]
public class UserLoginController : BaseController
{
    private static readonly string[] AllowedRoles = { "organization", "company", "department", "student", "faculty" };
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;

    public UserLoginController(AppDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    [HttpPost]
    public async Task<IActionResult> Login([FromBody] UserLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { success = false, errors = new[] { "Email and password are required." } });

        var user = await _context.Users
            .Include(u => u.SystemRole)
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            return Unauthorized(new { success = false, errors = new[] { "Invalid email or password." } });

        if (!user.IsActive)
            return Unauthorized(new { success = false, errors = new[] { "This account is inactive." } });

        if (user.SystemRole == null || !AllowedRoles.Contains(user.SystemRole.Slug))
            return Unauthorized(new { success = false, errors = new[] { "You are not authorized to access this portal." } });

        var token = _jwtService.GenerateToken(user.Id, user.Email, user.SystemRole.Slug, user.Role?.Slug);

        return Ok(new
        {
            success = true,
            data = new UserLoginResponse
            {
                Token = token,
                UserId = user.Id,
                Name = user.Name,
                Email = user.Email,
                SystemRoleSlug = user.SystemRole.Slug,
                RoleSlug = user.Role?.Slug ?? string.Empty
            }
        });
    }

    [HttpGet("validate")]
    [Authorize]
    public IActionResult Validate()
    {
        if (CurrentSystemRoleSlug == null || !AllowedRoles.Contains(CurrentSystemRoleSlug.ToLower()))
            return Unauthorized(new { success = false, message = "Not authorized for this portal." });

        return Ok(new
        {
            success = true,
            userId = CurrentUserId,
            email = CurrentUserEmail,
            systemRole = CurrentSystemRoleSlug,
            role = CurrentRoleSlug
        });
    }
}