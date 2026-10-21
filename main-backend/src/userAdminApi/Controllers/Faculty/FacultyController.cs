using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Shared.Services;
using dotnet.Data;
using dotnet.Models;
using dotnet.UserAdminApi.Dtos.Faculty;
using dotnet.UserAdminApi.Dtos.Students; // reuse LookupItemDto / PagedResult<T>

namespace dotnet.UserAdminApi.Controllers;

[Authorize]
[Route("api/user/faculty")]
public class FacultyController : BaseController
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public FacultyController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
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

        return (false, 0, null, null, "Not authorized to manage faculty.");
    }

    // ---------- LIST ----------
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int? companyId = null,
        [FromQuery] int? departmentId = null)
    {
        var (ok, organizationId, lockedCompanyId, lockedDepartmentId, error) = await ResolveScopeAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var query = _context.Faculties
            .AsNoTracking()
            .Include(f => f.User)
            .Include(f => f.Company)
            .Include(f => f.Department)
            .Include(f => f.SubRole)
            .Where(f => f.OrganizationId == organizationId);

        if (lockedDepartmentId.HasValue)
            query = query.Where(f => f.DepartmentId == lockedDepartmentId);
        else if (lockedCompanyId.HasValue)
            query = query.Where(f => f.CompanyId == lockedCompanyId);
        else
        {
            if (companyId.HasValue) query = query.Where(f => f.CompanyId == companyId);
            if (departmentId.HasValue) query = query.Where(f => f.DepartmentId == departmentId);
        }

        if (isActive.HasValue)
            query = query.Where(f => f.User!.IsActive == isActive.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(f =>
                f.Name.ToLower().Contains(term) ||
                f.User!.Email.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(f => f.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FacultyListItemDto
            {
                Id = f.Id,
                Name = f.Name,
                PhotoUrl = f.PhotoPath == null ? null : $"/storage/{f.PhotoPath}",
                Email = f.User!.Email,
                PhoneNumber = f.PhoneNumber,
                Address = f.Address,
                CompanyId = f.CompanyId,
                CompanyName = f.Company != null ? f.Company.Name : null,
                DepartmentId = f.DepartmentId,
                DepartmentName = f.Department != null ? f.Department.Name : null,
                SubRoleId = f.SubRoleId,
                SubRoleName = f.SubRole != null ? f.SubRole.Name : null,
                IsActive = f.User.IsActive
            })
            .ToListAsync();

        return Ok(new { success = true, data = new PagedResult<FacultyListItemDto> { Items = items, TotalCount = totalCount } });
    }

    // ---------- DETAIL ----------
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Detail(int id)
    {
        var (ok, organizationId, lockedCompanyId, lockedDepartmentId, error) = await ResolveScopeAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var query = _context.Faculties
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Company)
            .Include(x => x.Department)
            .Include(x => x.SubRole)
            .Where(x => x.OrganizationId == organizationId && x.Id == id);

        if (lockedDepartmentId.HasValue) query = query.Where(x => x.DepartmentId == lockedDepartmentId);
        else if (lockedCompanyId.HasValue) query = query.Where(x => x.CompanyId == lockedCompanyId);

        var f = await query.FirstOrDefaultAsync();
        if (f == null) return NotFound(new { success = false, errors = new[] { "Faculty not found." } });

        return Ok(new
        {
            success = true,
            data = new FacultyListItemDto
            {
                Id = f.Id,
                Name = f.Name,
                PhotoUrl = f.PhotoPath == null ? null : $"/storage/{f.PhotoPath}",
                Email = f.User!.Email,
                PhoneNumber = f.PhoneNumber,
                Address = f.Address,
                CompanyId = f.CompanyId,
                CompanyName = f.Company?.Name,
                DepartmentId = f.DepartmentId,
                DepartmentName = f.Department?.Name,
                SubRoleId = f.SubRoleId,
                SubRoleName = f.SubRole?.Name,
                IsActive = f.User.IsActive
            }
        });
    }

    // ---------- LOOKUPS ----------
    [HttpGet("companies-lookup")]
    public async Task<IActionResult> CompaniesLookup()
    {
        var (ok, organizationId, lockedCompanyId, _, error) = await ResolveScopeAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        if (lockedCompanyId.HasValue)
            return Ok(new { success = true, data = Array.Empty<LookupItemDto>() });

        var companies = await _context.Companies
            .AsNoTracking()
            .Where(c => c.OrganizationId == organizationId)
            .OrderBy(c => c.Name)
            .Select(c => new LookupItemDto { Id = c.Id, Name = c.Name })
            .ToListAsync();

        return Ok(new { success = true, data = companies });
    }

    [HttpGet("departments-lookup")]
    public async Task<IActionResult> DepartmentsLookup([FromQuery] int companyId)
    {
        var (ok, organizationId, lockedCompanyId, lockedDepartmentId, error) = await ResolveScopeAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        if (lockedDepartmentId.HasValue)
            return Ok(new { success = true, data = Array.Empty<LookupItemDto>() });

        var effectiveCompanyId = lockedCompanyId ?? companyId;

        var departments = await _context.Departments
            .AsNoTracking()
            .Where(d => d.OrganizationId == organizationId && d.CompanyId == effectiveCompanyId)
            .OrderBy(d => d.Name)
            .Select(d => new LookupItemDto { Id = d.Id, Name = d.Name })
            .ToListAsync();

        return Ok(new { success = true, data = departments });
    }

    // ---------- CREATE (transactional: user + faculty) ----------
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] FacultyCreateForm form)
    {
        var (scopeOk, organizationId, lockedCompanyId, lockedDepartmentId, scopeError) = await ResolveScopeAsync();
        if (!scopeOk) return Unauthorized(new { success = false, errors = new[] { scopeError } });

        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(form.Name)) errors.Add("Faculty name is required.");
        if (string.IsNullOrWhiteSpace(form.Email)) errors.Add("Email is required.");
        if (string.IsNullOrWhiteSpace(form.Password) || form.Password.Length < 6) errors.Add("Password must be at least 6 characters.");
        if (form.Password != form.ConfirmPassword) errors.Add("Passwords do not match.");

        if (await _context.Users.AnyAsync(u => u.Email == form.Email))
            errors.Add("Email is already in use.");

        // Department is MANDATORY for faculty
        int? effectiveCompanyId = lockedCompanyId ?? form.CompanyId;
        int? effectiveDepartmentId = lockedDepartmentId ?? form.DepartmentId;

        if (effectiveDepartmentId == null)
            errors.Add("Department is required for faculty.");

        Department? dept = null;
        if (effectiveDepartmentId != null)
        {
            var deptQuery = _context.Departments.Where(d => d.Id == effectiveDepartmentId && d.OrganizationId == organizationId);
            if (effectiveCompanyId.HasValue)
                deptQuery = deptQuery.Where(d => d.CompanyId == effectiveCompanyId);

            dept = await deptQuery.FirstOrDefaultAsync();
            if (dept == null)
                errors.Add("Selected department is invalid for the chosen company/organization.");
            else
                effectiveCompanyId = dept.CompanyId; // always trust department's own company
        }

        if (form.SubRoleId <= 0)
            errors.Add("Sub role is required.");
        else if (dept != null)
        {
            var validSubRole = await _context.SystemSubRoles.AnyAsync(sr => sr.Id == form.SubRoleId && sr.DepartmentId == dept.Id);
            if (!validSubRole) errors.Add("Selected sub role is invalid for this department.");
        }

        if (errors.Count > 0)
            return BadRequest(new { success = false, errors });

        var facultyRole = await _context.SystemRoles.FirstOrDefaultAsync(sr => sr.Slug == "faculty");
        if (facultyRole == null)
            return StatusCode(500, new { success = false, errors = new[] { "Faculty system role is not seeded." } });

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var user = new User
            {
                Name = form.Name,
                Email = form.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(form.Password),
                IsActive = true,
                SystemRoleId = facultyRole.Id,
                RoleId = null
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            string? photoPath = null;
            if (form.Photo != null)
                photoPath = await _fileStorage.SaveFileAsync(form.Photo, "faculty");

            var faculty = new Models.Faculty
            {
                OrganizationId = organizationId,
                CompanyId = effectiveCompanyId!.Value,
                DepartmentId = effectiveDepartmentId!.Value,
                SubRoleId = form.SubRoleId,
                UserId = user.Id,
                Name = form.Name,
                PhotoPath = photoPath,
                Address = form.Address,
                PhoneNumber = form.PhoneNumber
            };
            _context.Faculties.Add(faculty);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new { success = true, data = new { id = faculty.Id } });
        }
        catch
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { success = false, errors = new[] { "Failed to register faculty. Please try again." } });
        }
    }

    // ---------- UPDATE ----------
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromForm] FacultyUpdateForm form)
    {
        var (scopeOk, organizationId, lockedCompanyId, lockedDepartmentId, scopeError) = await ResolveScopeAsync();
        if (!scopeOk) return Unauthorized(new { success = false, errors = new[] { scopeError } });

        var facultyQuery = _context.Faculties.Where(f => f.Id == id && f.OrganizationId == organizationId);
        if (lockedDepartmentId.HasValue) facultyQuery = facultyQuery.Where(f => f.DepartmentId == lockedDepartmentId);
        else if (lockedCompanyId.HasValue) facultyQuery = facultyQuery.Where(f => f.CompanyId == lockedCompanyId);

        var faculty = await facultyQuery.FirstOrDefaultAsync();
        if (faculty == null)
            return NotFound(new { success = false, errors = new[] { "Faculty not found." } });

        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(form.Name)) errors.Add("Faculty name is required.");

        int? effectiveCompanyId = lockedCompanyId ?? form.CompanyId;
        int? effectiveDepartmentId = lockedDepartmentId ?? form.DepartmentId;

        if (effectiveDepartmentId == null)
            errors.Add("Department is required for faculty.");

        Department? dept = null;
        if (effectiveDepartmentId != null)
        {
            var deptQuery = _context.Departments.Where(d => d.Id == effectiveDepartmentId && d.OrganizationId == organizationId);
            if (effectiveCompanyId.HasValue) deptQuery = deptQuery.Where(d => d.CompanyId == effectiveCompanyId);
            dept = await deptQuery.FirstOrDefaultAsync();
            if (dept == null)
                errors.Add("Selected department is invalid for the chosen company/organization.");
            else
                effectiveCompanyId = dept.CompanyId;
        }

        if (form.SubRoleId <= 0)
            errors.Add("Sub role is required.");
        else if (dept != null)
        {
            var validSubRole = await _context.SystemSubRoles.AnyAsync(sr => sr.Id == form.SubRoleId && sr.DepartmentId == dept.Id);
            if (!validSubRole) errors.Add("Selected sub role is invalid for this department.");
        }

        if (errors.Count > 0)
            return BadRequest(new { success = false, errors });

        faculty.Name = form.Name;
        faculty.Address = form.Address;
        faculty.PhoneNumber = form.PhoneNumber;
        faculty.CompanyId = effectiveCompanyId!.Value;
        faculty.DepartmentId = effectiveDepartmentId!.Value;
        faculty.SubRoleId = form.SubRoleId;
        faculty.UpdatedAt = DateTime.UtcNow;

        if (form.Photo != null)
        {
            _fileStorage.DeleteFile(faculty.PhotoPath);
            faculty.PhotoPath = await _fileStorage.SaveFileAsync(form.Photo, "faculty");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == faculty.UserId);
        if (user != null) user.Name = form.Name;

        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ---------- TOGGLE ACTIVE ----------
    [HttpPatch("{id:int}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var (scopeOk, organizationId, lockedCompanyId, lockedDepartmentId, scopeError) = await ResolveScopeAsync();
        if (!scopeOk) return Unauthorized(new { success = false, errors = new[] { scopeError } });

        var query = _context.Faculties
            .Include(f => f.User)
            .Where(f => f.Id == id && f.OrganizationId == organizationId);
        if (lockedDepartmentId.HasValue) query = query.Where(f => f.DepartmentId == lockedDepartmentId);
        else if (lockedCompanyId.HasValue) query = query.Where(f => f.CompanyId == lockedCompanyId);

        var faculty = await query.FirstOrDefaultAsync();
        if (faculty == null || faculty.User == null)
            return NotFound(new { success = false, errors = new[] { "Faculty not found." } });

        faculty.User.IsActive = !faculty.User.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { isActive = faculty.User.IsActive } });
    }
}