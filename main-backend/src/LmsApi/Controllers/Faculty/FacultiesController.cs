using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Shared.Services;
using dotnet.Data;
using dotnet.LmsApi.Dtos;

namespace dotnet.LmsApi.Controllers;

[Authorize]
[Route("api/lms/faculties")]
public class FacultiesController : BaseController
{
    private readonly AppDbContext _context;
    public FacultiesController(AppDbContext context) { _context = context; }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string? query, [FromQuery] int? subRoleId)
    {
        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var q = _context.Faculties.Include(f => f.SubRole)
            .Where(f => f.OrganizationId == scope.OrganizationId);

        if (scope.CompanyId != null) q = q.Where(f => f.CompanyId == scope.CompanyId);
        if (scope.DepartmentId != null) q = q.Where(f => f.DepartmentId == scope.DepartmentId);

        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(f => f.Name.ToLower().Contains(query.ToLower()));

        if (subRoleId != null)
            q = q.Where(f => f.SubRoleId == subRoleId);

        var results = await q.OrderBy(f => f.Name).Take(30).Select(f => new FacultySearchResultDto
        {
            Id = f.Id,
            Name = f.Name,
            PhotoUrl = string.IsNullOrEmpty(f.PhotoPath) ? null : $"/storage/{f.PhotoPath}",
            SubRoleName = f.SubRole != null ? f.SubRole.Name : null,
            PhoneNumber = f.PhoneNumber
        }).ToListAsync();

        return Ok(new { success = true, data = results });
    }

    [HttpGet("sub-roles")]
    public async Task<IActionResult> SubRoles()
    {
        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var q = _context.SystemSubRoles.Where(r => r.OrganizationId == scope.OrganizationId && r.IsActive);
        if (scope.CompanyId != null) q = q.Where(r => r.CompanyId == null || r.CompanyId == scope.CompanyId);
        if (scope.DepartmentId != null) q = q.Where(r => r.DepartmentId == scope.DepartmentId);

        var results = await q.OrderBy(r => r.Name)
            .Select(r => new SubRoleOptionDto { Id = r.Id, Name = r.Name }).ToListAsync();

        return Ok(new { success = true, data = results });
    }
}