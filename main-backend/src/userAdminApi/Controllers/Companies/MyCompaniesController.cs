using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Shared.Services;
using dotnet.Data;
using dotnet.UserAdminApi.Dtos.Companies;
using dotnet.UserAdminApi.Dtos.Students; // reuse PagedResult<T>
using dotnet.Models;

namespace dotnet.UserAdminApi.Controllers;

[Authorize]
[Route("api/user/companies")]
public class MyCompaniesController : BaseController
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public MyCompaniesController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    // Only "organization" callers manage companies. Company/department users
    // don't get a company list — they already know who they are.
    private async Task<(bool ok, int organizationId, string error)> ResolveOrgAsync()
    {
        var role = CurrentSystemRoleSlug?.ToLower();
        if (role != "organization")
            return (false, 0, "Only organization accounts can manage companies.");

        var org = await _context.Organizations.FirstOrDefaultAsync(o => o.UserId == CurrentUserId);
        if (org == null) return (false, 0, "Organization not found.");

        return (true, org.Id, "");
    }


    // ---------- CREATE ----------
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create([FromForm] CompanyCreateForm form)
    {
        var (ok, organizationId, error) = await ResolveOrgAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(form.Name)) errors.Add("Company name is required.");
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

        var systemRole = await _context.SystemRoles.FirstOrDefaultAsync(sr => sr.Slug == "company");

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

        var company = new Company
        {
            OrganizationId = organizationId,
            UserId = user.Id,
            Name = form.Name,
            AdminName = form.AdminName,
            PhoneNumber = form.PhoneNumber,
            Address = form.Address,
            Place = form.Place
        };
        _context.Companies.Add(company);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        if (form.Logo != null)
        {
            var path = await _fileStorage.SaveFileAsync(form.Logo, $"companies/{company.Id}");
            company.LogoPath = path;
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, data = new { company.Id, company.Name } });
    }

    // ---------- LIST ----------
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        var (ok, organizationId, error) = await ResolveOrgAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var query = _context.Companies
            .AsNoTracking()
            .Include(c => c.User)
            .Include(c => c.Departments)
            .Where(c => c.OrganizationId == organizationId);

        if (isActive.HasValue)
            query = query.Where(c => c.User!.IsActive == isActive.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(c =>
                c.Name.ToLower().Contains(term) ||
                c.AdminName.ToLower().Contains(term) ||
                c.User!.Email.ToLower().Contains(term));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(c => c.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CompanyListItemDto
            {
                Id = c.Id,
                Name = c.Name,
                AdminName = c.AdminName,
                LogoUrl = c.LogoPath == null ? null : $"/storage/{c.LogoPath}",
                Email = c.User!.Email,
                PhoneNumber = c.PhoneNumber,
                Address = c.Address,
                Place = c.Place,
                IsActive = c.User.IsActive,
                DepartmentCount = c.Departments.Count
            })
            .ToListAsync();

        return Ok(new { success = true, data = new PagedResult<CompanyListItemDto> { Items = items, TotalCount = totalCount } });
    }

    // ---------- DETAIL ----------
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Detail(int id)
    {
        var (ok, organizationId, error) = await ResolveOrgAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var c = await _context.Companies
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Departments)
            .FirstOrDefaultAsync(x => x.Id == id && x.OrganizationId == organizationId);

        if (c == null) return NotFound(new { success = false, errors = new[] { "Company not found." } });

        return Ok(new
        {
            success = true,
            data = new CompanyListItemDto
            {
                Id = c.Id,
                Name = c.Name,
                AdminName = c.AdminName,
                LogoUrl = c.LogoPath == null ? null : $"/storage/{c.LogoPath}",
                Email = c.User!.Email,
                PhoneNumber = c.PhoneNumber,
                Address = c.Address,
                Place = c.Place,
                IsActive = c.User.IsActive,
                DepartmentCount = c.Departments.Count
            }
        });
    }

    // ---------- UPDATE ----------
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromForm] CompanyUpdateForm form)
    {
        var (ok, organizationId, error) = await ResolveOrgAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == organizationId);
        if (company == null) return NotFound(new { success = false, errors = new[] { "Company not found." } });

        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(form.Name)) errors.Add("Company name is required.");
        if (string.IsNullOrWhiteSpace(form.AdminName)) errors.Add("Admin name is required.");
        if (errors.Count > 0) return BadRequest(new { success = false, errors });

        company.Name = form.Name;
        company.AdminName = form.AdminName;
        company.PhoneNumber = form.PhoneNumber;
        company.Address = form.Address;
        company.Place = form.Place;
        company.UpdatedAt = DateTime.UtcNow;

        if (form.Logo != null)
        {
            _fileStorage.DeleteFile(company.LogoPath);
            company.LogoPath = await _fileStorage.SaveFileAsync(form.Logo, "companies");
        }

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == company.UserId);
        if (user != null) user.Name = form.AdminName;

        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ---------- TOGGLE ACTIVE ----------
    [HttpPatch("{id:int}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var (ok, organizationId, error) = await ResolveOrgAsync();
        if (!ok) return Unauthorized(new { success = false, errors = new[] { error } });

        var company = await _context.Companies
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == organizationId);

        if (company == null || company.User == null)
            return NotFound(new { success = false, errors = new[] { "Company not found." } });

        company.User.IsActive = !company.User.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { isActive = company.User.IsActive } });
    }
}