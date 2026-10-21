using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Shared.Services;
using dotnet.Data;
using dotnet.Models;
using dotnet.UserAdminApi.Dtos.Students;

namespace dotnet.UserAdminApi.Controllers;

[Authorize]
[Route("api/user/students")]
public class StudentsController : BaseController
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public StudentsController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    // Resolves what the logged-in user (organization/company/department) can
    // see and create students under. Locks scope fields the caller doesn't own.
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

        return (false, 0, null, null, "Not authorized to manage students.");
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

        var query = _context.Students
            .AsNoTracking()
            .Include(s => s.User)
            .Include(s => s.Company)
            .Include(s => s.Department)
            .Where(s => s.OrganizationId == organizationId);

        if (lockedDepartmentId.HasValue)
            query = query.Where(s => s.DepartmentId == lockedDepartmentId);
        else if (lockedCompanyId.HasValue)
            query = query.Where(s => s.CompanyId == lockedCompanyId);
        else
        {
            if (companyId.HasValue) query = query.Where(s => s.CompanyId == companyId);
            if (departmentId.HasValue) query = query.Where(s => s.DepartmentId == departmentId);
        }

        if (isActive.HasValue)
            query = query.Where(s => s.User!.IsActive == isActive.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(s =>
                s.Name.ToLower().Contains(term) ||
                s.User!.Email.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(s => s.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new StudentListItemDto
            {
                Id = s.Id,
                Name = s.Name,
                PhotoUrl = s.PhotoPath == null ? null : $"/storage/{s.PhotoPath}",
                Email = s.User!.Email,
                PhoneNumber = s.PhoneNumber,
                Address = s.Address,
                CompanyId = s.CompanyId,
                CompanyName = s.Company != null ? s.Company.Name : null,
                DepartmentId = s.DepartmentId,
                DepartmentName = s.Department != null ? s.Department.Name : null,
                IsActive = s.User.IsActive
            })
            .ToListAsync();

        return Ok(new { success = true, data = new PagedResult<StudentListItemDto> { Items = items, TotalCount = totalCount } });
    }

    // ---------- DETAIL ----------
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Detail(int id)
    {
        var (ok, organizationId, lockedCompanyId, lockedDepartmentId, error) = await ResolveScopeAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var query = _context.Students
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Company)
            .Include(x => x.Department)
            .Where(x => x.OrganizationId == organizationId && x.Id == id);

        if (lockedDepartmentId.HasValue) query = query.Where(x => x.DepartmentId == lockedDepartmentId);
        else if (lockedCompanyId.HasValue) query = query.Where(x => x.CompanyId == lockedCompanyId);

        var s = await query.FirstOrDefaultAsync();
        if (s == null) return NotFound(new { success = false, errors = new[] { "Student not found." } });

        return Ok(new
        {
            success = true,
            data = new StudentListItemDto
            {
                Id = s.Id,
                Name = s.Name,
                PhotoUrl = s.PhotoPath == null ? null : $"/storage/{s.PhotoPath}",
                Email = s.User!.Email,
                PhoneNumber = s.PhoneNumber,
                Address = s.Address,
                CompanyId = s.CompanyId,
                CompanyName = s.Company?.Name,
                DepartmentId = s.DepartmentId,
                DepartmentName = s.Department?.Name,
                IsActive = s.User.IsActive
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

    // ---------- CREATE (transactional: user + student) ----------
    [HttpPost]
    public async Task<IActionResult> Create([FromForm] StudentCreateForm form)
    {
        var (scopeOk, organizationId, lockedCompanyId, lockedDepartmentId, scopeError) = await ResolveScopeAsync();
        if (!scopeOk) return Unauthorized(new { success = false, errors = new[] { scopeError } });

        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(form.Name)) errors.Add("Student name is required.");
        if (string.IsNullOrWhiteSpace(form.Email)) errors.Add("Email is required.");
        if (string.IsNullOrWhiteSpace(form.Password) || form.Password.Length < 6) errors.Add("Password must be at least 6 characters.");
        if (form.Password != form.ConfirmPassword) errors.Add("Passwords do not match.");

        if (await _context.Users.AnyAsync(u => u.Email == form.Email))
            errors.Add("Email is already in use.");

        int? effectiveCompanyId = lockedCompanyId ?? form.CompanyId;
        int? effectiveDepartmentId = lockedDepartmentId ?? form.DepartmentId;

        if (effectiveCompanyId.HasValue)
        {
            var validCompany = await _context.Companies.AnyAsync(c => c.Id == effectiveCompanyId && c.OrganizationId == organizationId);
            if (!validCompany) errors.Add("Selected company is invalid for this organization.");
        }

        if (effectiveDepartmentId.HasValue)
        {
            var deptQuery = _context.Departments.Where(d => d.Id == effectiveDepartmentId && d.OrganizationId == organizationId);
            if (effectiveCompanyId.HasValue)
                deptQuery = deptQuery.Where(d => d.CompanyId == effectiveCompanyId);
            var validDept = await deptQuery.AnyAsync();
            if (!validDept) errors.Add("Selected department is invalid for the chosen company/organization.");
        }

        if (errors.Count > 0)
            return BadRequest(new { success = false, errors });

        var studentRole = await _context.SystemRoles.FirstOrDefaultAsync(sr => sr.Slug == "student");
        if (studentRole == null)
            return StatusCode(500, new { success = false, errors = new[] { "Student system role is not seeded." } });

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var user = new User
            {
                Name = form.Name,
                Email = form.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(form.Password),
                IsActive = true,
                SystemRoleId = studentRole.Id,
                RoleId = null
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            string? photoPath = null;
            if (form.Photo != null)
                photoPath = await _fileStorage.SaveFileAsync(form.Photo, "students");

            var student = new Student
            {
                OrganizationId = organizationId,
                CompanyId = effectiveCompanyId,
                DepartmentId = effectiveDepartmentId,
                UserId = user.Id,
                Name = form.Name,
                PhotoPath = photoPath,
                Address = form.Address,
                PhoneNumber = form.PhoneNumber
            };
            _context.Students.Add(student);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return Ok(new { success = true, data = new { id = student.Id } });
        }
        catch
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { success = false, errors = new[] { "Failed to register student. Please try again." } });
        }
    }

    // ---------- UPDATE ----------
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromForm] StudentUpdateForm form)
    {
        var (scopeOk, organizationId, lockedCompanyId, lockedDepartmentId, scopeError) = await ResolveScopeAsync();
        if (!scopeOk) return Unauthorized(new { success = false, errors = new[] { scopeError } });

        var studentQuery = _context.Students.Where(s => s.Id == id && s.OrganizationId == organizationId);
        if (lockedDepartmentId.HasValue) studentQuery = studentQuery.Where(s => s.DepartmentId == lockedDepartmentId);
        else if (lockedCompanyId.HasValue) studentQuery = studentQuery.Where(s => s.CompanyId == lockedCompanyId);

        var student = await studentQuery.FirstOrDefaultAsync();
        if (student == null)
            return NotFound(new { success = false, errors = new[] { "Student not found." } });

        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(form.Name)) errors.Add("Student name is required.");

        int? effectiveCompanyId = lockedCompanyId ?? form.CompanyId;
        int? effectiveDepartmentId = lockedDepartmentId ?? form.DepartmentId;

        if (effectiveCompanyId.HasValue)
        {
            var validCompany = await _context.Companies.AnyAsync(c => c.Id == effectiveCompanyId && c.OrganizationId == organizationId);
            if (!validCompany) errors.Add("Selected company is invalid for this organization.");
        }

        if (effectiveDepartmentId.HasValue)
        {
            var deptQuery = _context.Departments.Where(d => d.Id == effectiveDepartmentId && d.OrganizationId == organizationId);
            if (effectiveCompanyId.HasValue) deptQuery = deptQuery.Where(d => d.CompanyId == effectiveCompanyId);
            var validDept = await deptQuery.AnyAsync();
            if (!validDept) errors.Add("Selected department is invalid for the chosen company/organization.");
        }

        if (errors.Count > 0)
            return BadRequest(new { success = false, errors });

        student.Name = form.Name;
        student.Address = form.Address;
        student.PhoneNumber = form.PhoneNumber;
        student.CompanyId = effectiveCompanyId;
        student.DepartmentId = effectiveDepartmentId;
        student.UpdatedAt = DateTime.UtcNow;

        if (form.Photo != null)
        {
            _fileStorage.DeleteFile(student.PhotoPath);
            student.PhotoPath = await _fileStorage.SaveFileAsync(form.Photo, "students");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == student.UserId);
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

        var query = _context.Students
            .Include(s => s.User)
            .Where(s => s.Id == id && s.OrganizationId == organizationId);
        if (lockedDepartmentId.HasValue) query = query.Where(s => s.DepartmentId == lockedDepartmentId);
        else if (lockedCompanyId.HasValue) query = query.Where(s => s.CompanyId == lockedCompanyId);

        var student = await query.FirstOrDefaultAsync();
        if (student == null || student.User == null)
            return NotFound(new { success = false, errors = new[] { "Student not found." } });

        student.User.IsActive = !student.User.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { isActive = student.User.IsActive } });
    }
}