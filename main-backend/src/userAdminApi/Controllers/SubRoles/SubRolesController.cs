using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Data;
using dotnet.Models;
using dotnet.UserAdminApi.Dtos.SubRoles;

namespace dotnet.UserAdminApi.Controllers;

[Authorize]
[Route("api/user/subroles")]
public class SubRolesController : BaseController
{
    private readonly AppDbContext _context;

    public SubRolesController(AppDbContext context)
    {
        _context = context;
    }

    private async Task<(bool ok, int organizationId, int? lockedCompanyId, int? lockedDepartmentId, string error)> ResolveScopeAsync()
    {
        var role = CurrentSystemRoleSlug?.ToLower();

        if (role == "organization")
        {
            var org = await _context.Organizations.FirstOrDefaultAsync(o => o.UserId == CurrentUserId);
            if (org == null) return (false, 0, null, null, "Organization not found.");
            return (true, org.Id, null, null, "");
        }

        if (role == "company")
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == CurrentUserId);
            if (company == null) return (false, 0, null, null, "Company not found.");
            return (true, company.OrganizationId, company.Id, null, "");
        }

        if (role == "department")
        {
            var department = await _context.Departments.FirstOrDefaultAsync(d => d.UserId == CurrentUserId);
            if (department == null) return (false, 0, null, null, "Department not found.");
            return (true, department.OrganizationId, department.CompanyId, department.Id, "");
        }

        return (false, 0, null, null, "Not authorized to manage sub roles.");
    }

    // ---------- LIST (by department, with optional search for typeahead) ----------
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int? departmentId, [FromQuery] string? search = null)
    {
        var (ok, organizationId, lockedCompanyId, lockedDepartmentId, error) = await ResolveScopeAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var effectiveDepartmentId = lockedDepartmentId ?? departmentId;
        if (effectiveDepartmentId == null)
            return BadRequest(new { success = false, errors = new[] { "departmentId is required." } });

        var validDept = await _context.Departments.AnyAsync(d =>
            d.Id == effectiveDepartmentId &&
            d.OrganizationId == organizationId &&
            (!lockedCompanyId.HasValue || d.CompanyId == lockedCompanyId));
        if (!validDept)
            return BadRequest(new { success = false, errors = new[] { "Invalid department for this scope." } });

        var query = _context.SystemSubRoles
            .AsNoTracking()
            .Where(sr => sr.DepartmentId == effectiveDepartmentId && sr.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(sr => sr.Name.ToLower().Contains(term));
        }

        var items = await query
            .OrderBy(sr => sr.Name)
            .Select(sr => new SubRoleDto { Id = sr.Id, Name = sr.Name, DepartmentId = sr.DepartmentId, IsActive = sr.IsActive })
            .ToListAsync();

        return Ok(new { success = true, data = items });
    }

    // ---------- CREATE ----------
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] SubRoleCreateForm form)
    {
        var (ok, organizationId, lockedCompanyId, lockedDepartmentId, error) = await ResolveScopeAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var effectiveDepartmentId = lockedDepartmentId ?? form.DepartmentId;
        if (effectiveDepartmentId == null)
            return BadRequest(new { success = false, errors = new[] { "Department is required." } });

        if (string.IsNullOrWhiteSpace(form.Name))
            return BadRequest(new { success = false, errors = new[] { "Sub role name is required." } });

        var dept = await _context.Departments.FirstOrDefaultAsync(d =>
            d.Id == effectiveDepartmentId &&
            d.OrganizationId == organizationId &&
            (!lockedCompanyId.HasValue || d.CompanyId == lockedCompanyId));
        if (dept == null)
            return BadRequest(new { success = false, errors = new[] { "Invalid department for this scope." } });

        var exists = await _context.SystemSubRoles.AnyAsync(sr =>
            sr.DepartmentId == effectiveDepartmentId && sr.Name.ToLower() == form.Name.Trim().ToLower());
        if (exists)
            return BadRequest(new { success = false, errors = new[] { "A sub role with this name already exists in this department." } });

        var subRole = new SystemSubRole
        {
            OrganizationId = organizationId,
            CompanyId = dept.CompanyId,
            DepartmentId = dept.Id,
            Name = form.Name.Trim(),
            IsActive = true
        };
        _context.SystemSubRoles.Add(subRole);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new SubRoleDto { Id = subRole.Id, Name = subRole.Name, DepartmentId = subRole.DepartmentId, IsActive = subRole.IsActive } });
    }

    // ---------- UPDATE ----------
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromForm] SubRoleUpdateForm form)
    {
        var (ok, organizationId, lockedCompanyId, lockedDepartmentId, error) = await ResolveScopeAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var subRole = await _context.SystemSubRoles.FirstOrDefaultAsync(sr => sr.Id == id && sr.OrganizationId == organizationId);
        if (subRole == null)
            return NotFound(new { success = false, errors = new[] { "Sub role not found." } });

        if (lockedDepartmentId.HasValue && subRole.DepartmentId != lockedDepartmentId)
            return Unauthorized(new { success = false, errors = new[] { "Not authorized to edit this sub role." } });
        if (lockedCompanyId.HasValue && subRole.CompanyId != lockedCompanyId)
            return Unauthorized(new { success = false, errors = new[] { "Not authorized to edit this sub role." } });

        if (string.IsNullOrWhiteSpace(form.Name))
            return BadRequest(new { success = false, errors = new[] { "Sub role name is required." } });

        subRole.Name = form.Name.Trim();
        subRole.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }
}