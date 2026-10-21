using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Shared.Services;
using dotnet.Data;
using dotnet.UserAdminApi.Dtos.Departments;
using dotnet.UserAdminApi.Dtos.Students; // reuse PagedResult<T>
using dotnet.Models;

namespace dotnet.UserAdminApi.Controllers;

[Authorize]
[Route("api/user/departments")]
public class MyDepartmentsController : BaseController
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public MyDepartmentsController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    // organization: sees any department, filterable by companyId (required, since
    //   they're browsing INTO a specific company they picked from the company list)
    // company: locked to their own companyId, ignoring any query param
    // department: not allowed here — they don't manage other departments
    private async Task<(bool ok, int organizationId, int? lockedCompanyId, string error)> ResolveScopeAsync()
    {
        var role = CurrentSystemRoleSlug?.ToLower();

        if (role == "organization")
        {
            var org = await _context.Organizations.FirstOrDefaultAsync(o => o.UserId == CurrentUserId);
            if (org == null) return (false, 0, null, "Organization not found.");
            return (true, org.Id, null, "");
        }

        if (role == "company")
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == CurrentUserId);
            if (company == null) return (false, 0, null, "Company not found.");
            return (true, company.OrganizationId, company.Id, "");
        }

        return (false, 0, null, "Not authorized to manage departments.");
    }



    // ---------- CREATE ----------
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create([FromForm] DepartmentCreateForm form)
    {
        var (ok, organizationId, lockedCompanyId, error) = await ResolveScopeAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var effectiveCompanyId = lockedCompanyId ?? form.CompanyId;
        if (effectiveCompanyId == null)
            return BadRequest(new { success = false, errors = new[] { "companyId is required." } });

        var validCompany = await _context.Companies.AnyAsync(c => c.Id == effectiveCompanyId && c.OrganizationId == organizationId);
        if (!validCompany)
            return BadRequest(new { success = false, errors = new[] { "Invalid company for this organization." } });

        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(form.Name)) errors.Add("Department name is required.");
        if (string.IsNullOrWhiteSpace(form.AdminName)) errors.Add("Admin name is required.");
        if (string.IsNullOrWhiteSpace(form.PhoneNumber)) errors.Add("Phone number is required.");
        if (string.IsNullOrWhiteSpace(form.Address)) errors.Add("Address is required.");
        if (string.IsNullOrWhiteSpace(form.Place)) errors.Add("Place is required.");
        if (string.IsNullOrWhiteSpace(form.Email)) errors.Add("Email is required.");
        if (string.IsNullOrWhiteSpace(form.Password)) errors.Add("Password is required.");
        if (form.Password != form.ConfirmPassword) errors.Add("Passwords do not match.");

        if (await _context.Users.AnyAsync(u => u.Email == form.Email))
            errors.Add("Email is already in use.");

        if (errors.Any())
            return BadRequest(new { success = false, errors });

        var systemRole = await _context.SystemRoles.FirstOrDefaultAsync(sr => sr.Slug == "department");

        using var transaction = await _context.Database.BeginTransactionAsync();

        var user = new User
        {
            Name = form.AdminName,
            Email = form.Email,
            PhoneNumber = form.PhoneNumber,
            Password = BCrypt.Net.BCrypt.HashPassword(form.Password),
            SystemRoleId = systemRole?.Id,
            RoleId = null,
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var department = new Department
        {
            OrganizationId = organizationId,
            CompanyId = effectiveCompanyId.Value,
            UserId = user.Id,
            Name = form.Name,
            AdminName = form.AdminName,
            PhoneNumber = form.PhoneNumber,
            Address = form.Address,
            Place = form.Place
        };
        _context.Departments.Add(department);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        if (form.Logo != null)
        {
            var path = await _fileStorage.SaveFileAsync(form.Logo, $"departments/{department.Id}");
            department.LogoPath = path;
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, data = new { department.Id, department.Name } });
    }

    // ---------- LIST ----------
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] int? companyId = null)
    {
        var (ok, organizationId, lockedCompanyId, error) = await ResolveScopeAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var effectiveCompanyId = lockedCompanyId ?? companyId;
        if (effectiveCompanyId == null)
            return BadRequest(new { success = false, errors = new[] { "companyId is required." } });

        var validCompany = await _context.Companies.AnyAsync(c => c.Id == effectiveCompanyId && c.OrganizationId == organizationId);
        if (!validCompany)
            return BadRequest(new { success = false, errors = new[] { "Invalid company for this organization." } });

        var query = _context.Departments
            .AsNoTracking()
            .Include(d => d.User)
            .Include(d => d.Company)
            .Where(d => d.OrganizationId == organizationId && d.CompanyId == effectiveCompanyId);

        if (isActive.HasValue)
            query = query.Where(d => d.User!.IsActive == isActive.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(d =>
                d.Name.ToLower().Contains(term) ||
                d.AdminName.ToLower().Contains(term) ||
                d.User!.Email.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(d => d.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new DepartmentListItemDto
            {
                Id = d.Id,
                Name = d.Name,
                AdminName = d.AdminName,
                LogoUrl = d.LogoPath == null ? null : $"/storage/{d.LogoPath}",
                Email = d.User!.Email,
                PhoneNumber = d.PhoneNumber,
                Address = d.Address,
                Place = d.Place,
                CompanyId = d.CompanyId,
                CompanyName = d.Company != null ? d.Company.Name : null,
                IsActive = d.User.IsActive
            })
            .ToListAsync();

        return Ok(new { success = true, data = new PagedResult<DepartmentListItemDto> { Items = items, TotalCount = totalCount } });
    }

    // ---------- DETAIL ----------
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Detail(int id)
    {
        var (ok, organizationId, lockedCompanyId, error) = await ResolveScopeAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var query = _context.Departments
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Company)
            .Where(x => x.Id == id && x.OrganizationId == organizationId);

        if (lockedCompanyId.HasValue) query = query.Where(x => x.CompanyId == lockedCompanyId);

        var d = await query.FirstOrDefaultAsync();
        if (d == null) return NotFound(new { success = false, errors = new[] { "Department not found." } });

        return Ok(new
        {
            success = true,
            data = new DepartmentListItemDto
            {
                Id = d.Id,
                Name = d.Name,
                AdminName = d.AdminName,
                LogoUrl = d.LogoPath == null ? null : $"/storage/{d.LogoPath}",
                Email = d.User!.Email,
                PhoneNumber = d.PhoneNumber,
                Address = d.Address,
                Place = d.Place,
                CompanyId = d.CompanyId,
                CompanyName = d.Company?.Name,
                IsActive = d.User.IsActive
            }
        });
    }

    // ---------- UPDATE ----------
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromForm] DepartmentUpdateForm form)
    {
        var (ok, organizationId, lockedCompanyId, error) = await ResolveScopeAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var query = _context.Departments.Where(d => d.Id == id && d.OrganizationId == organizationId);
        if (lockedCompanyId.HasValue) query = query.Where(d => d.CompanyId == lockedCompanyId);

        var department = await query.FirstOrDefaultAsync();
        if (department == null) return NotFound(new { success = false, errors = new[] { "Department not found." } });

        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(form.Name)) errors.Add("Department name is required.");
        if (string.IsNullOrWhiteSpace(form.AdminName)) errors.Add("Admin name is required.");
        if (errors.Count > 0) return BadRequest(new { success = false, errors });

        department.Name = form.Name;
        department.AdminName = form.AdminName;
        department.PhoneNumber = form.PhoneNumber;
        department.Address = form.Address;
        department.Place = form.Place;
        department.UpdatedAt = DateTime.UtcNow;

        if (form.Logo != null)
        {
            _fileStorage.DeleteFile(department.LogoPath);
            department.LogoPath = await _fileStorage.SaveFileAsync(form.Logo, "departments");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == department.UserId);
        if (user != null) user.Name = form.AdminName;

        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ---------- TOGGLE ACTIVE ----------
    [HttpPatch("{id:int}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var (ok, organizationId, lockedCompanyId, error) = await ResolveScopeAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var query = _context.Departments
            .Include(d => d.User)
            .Where(d => d.Id == id && d.OrganizationId == organizationId);
        if (lockedCompanyId.HasValue) query = query.Where(d => d.CompanyId == lockedCompanyId);

        var department = await query.FirstOrDefaultAsync();
        if (department == null || department.User == null)
            return NotFound(new { success = false, errors = new[] { "Department not found." } });

        department.User.IsActive = !department.User.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { isActive = department.User.IsActive } });
    }
}