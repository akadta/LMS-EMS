using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Shared.Services;
using dotnet.Data;
using dotnet.Models;
using dotnet.CentralAdminApi.Dtos;

namespace dotnet.CentralAdminApi.Controllers;

[Authorize]
[Route("api/central/organizations/{organizationId:int}/companies/{companyId:int}/departments")]
public class DepartmentController : BaseController
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public DepartmentController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    private static string? LogoUrl(string? path) =>
        string.IsNullOrEmpty(path) ? null : $"/storage/{path}";

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create(int organizationId, int companyId, [FromForm] CreateDepartmentRequest request)
    {
        var company = await _context.Companies
            .FirstOrDefaultAsync(c => c.Id == companyId && c.OrganizationId == organizationId);
        if (company == null)
            return NotFound(new { success = false, errors = new[] { "Company not found." } });

        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(request.Name)) errors.Add("Department name is required.");
        if (string.IsNullOrWhiteSpace(request.AdminName)) errors.Add("Admin name is required.");
        if (string.IsNullOrWhiteSpace(request.PhoneNumber)) errors.Add("Phone number is required.");
        if (string.IsNullOrWhiteSpace(request.Address)) errors.Add("Address is required.");
        if (string.IsNullOrWhiteSpace(request.Place)) errors.Add("Place is required.");
        if (string.IsNullOrWhiteSpace(request.Email)) errors.Add("Email is required.");
        if (string.IsNullOrWhiteSpace(request.Password)) errors.Add("Password is required.");
        if (request.Password != request.ConfirmPassword) errors.Add("Passwords do not match.");

        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            errors.Add("Email is already in use.");

        if (errors.Any())
            return BadRequest(new { success = false, errors });

        var systemRole = await _context.SystemRoles.FirstOrDefaultAsync(sr => sr.Slug == "department");

        using var transaction = await _context.Database.BeginTransactionAsync();

        var user = new User
        {
            Name = request.AdminName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
            SystemRoleId = systemRole?.Id,
            RoleId = null,
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var department = new Department
        {
            OrganizationId = organizationId,
            CompanyId = companyId,
            UserId = user.Id,
            Name = request.Name,
            AdminName = request.AdminName,
            PhoneNumber = request.PhoneNumber,
            Address = request.Address,
            Place = request.Place
        };
        _context.Departments.Add(department);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        if (request.Logo != null)
        {
            var path = await _fileStorage.SaveFileAsync(request.Logo, $"departments/{department.Id}");
            department.LogoPath = path;
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, data = new { department.Id, department.Name } });
    }

    [HttpGet]
    public async Task<IActionResult> List(
        int organizationId,
        int companyId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 20 : pageSize;

        var query = _context.Departments
            .Include(d => d.User)
            .Where(d => d.OrganizationId == organizationId && d.CompanyId == companyId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(d =>
                EF.Functions.ILike(d.Name, $"%{search}%") ||
                EF.Functions.ILike(d.AdminName, $"%{search}%") ||
                (d.User != null && EF.Functions.ILike(d.User.Email, $"%{search}%")));

        if (isActive.HasValue)
            query = query.Where(d => d.User != null && d.User.IsActive == isActive);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(d => d.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(d => new DepartmentListItem
            {
                Id = d.Id,
                Name = d.Name,
                AdminName = d.AdminName,
                Email = d.User!.Email,
                PhoneNumber = d.PhoneNumber,
                Place = d.Place,
                LogoUrl = d.LogoPath == null ? null : "/storage/" + d.LogoPath,
                IsActive = d.User.IsActive,
                CreatedAt = d.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = new PagedResult<DepartmentListItem>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            }
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int organizationId, int companyId, int id)
    {
        var department = await _context.Departments
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == id && d.OrganizationId == organizationId && d.CompanyId == companyId);

        if (department == null || department.User == null)
            return NotFound(new { success = false, errors = new[] { "Department not found." } });

        var detail = new DepartmentDetail
        {
            Id = department.Id,
            OrganizationId = department.OrganizationId,
            CompanyId = department.CompanyId,
            Name = department.Name,
            AdminName = department.AdminName,
            Email = department.User.Email,
            PhoneNumber = department.PhoneNumber,
            Address = department.Address,
            Place = department.Place,
            LogoUrl = LogoUrl(department.LogoPath),
            IsActive = department.User.IsActive,
            CreatedAt = department.CreatedAt
        };

        return Ok(new { success = true, data = detail });
    }

    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Update(int organizationId, int companyId, int id, [FromForm] UpdateDepartmentRequest request)
    {
        var department = await _context.Departments
            .FirstOrDefaultAsync(d => d.Id == id && d.OrganizationId == organizationId && d.CompanyId == companyId);

        if (department == null)
            return NotFound(new { success = false, errors = new[] { "Department not found." } });

        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(request.Name)) errors.Add("Department name is required.");
        if (string.IsNullOrWhiteSpace(request.AdminName)) errors.Add("Admin name is required.");
        if (string.IsNullOrWhiteSpace(request.PhoneNumber)) errors.Add("Phone number is required.");
        if (string.IsNullOrWhiteSpace(request.Address)) errors.Add("Address is required.");
        if (string.IsNullOrWhiteSpace(request.Place)) errors.Add("Place is required.");

        if (errors.Any())
            return BadRequest(new { success = false, errors });

        department.Name = request.Name;
        department.AdminName = request.AdminName;
        department.PhoneNumber = request.PhoneNumber;
        department.Address = request.Address;
        department.Place = request.Place;
        department.UpdatedAt = DateTime.UtcNow;

        if (request.Logo != null)
        {
            _fileStorage.DeleteFile(department.LogoPath);
            department.LogoPath = await _fileStorage.SaveFileAsync(request.Logo, $"departments/{department.Id}");
        }

        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }

    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int organizationId, int companyId, int id)
    {
        var department = await _context.Departments
            .Include(d => d.User)
            .FirstOrDefaultAsync(d => d.Id == id && d.OrganizationId == organizationId && d.CompanyId == companyId);

        if (department?.User == null)
            return NotFound(new { success = false, errors = new[] { "Department not found." } });

        department.User.IsActive = !department.User.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, isActive = department.User.IsActive });
    }
}