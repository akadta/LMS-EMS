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
[Route("api/central/organizations/{organizationId:int}/companies")]
public class CompanyController : BaseController
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public CompanyController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    private static string? LogoUrl(string? path) =>
        string.IsNullOrEmpty(path) ? null : $"/storage/{path}";

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create(int organizationId, [FromForm] CreateCompanyRequest request)
    {
        var org = await _context.Organizations.FindAsync(organizationId);
        if (org == null)
            return NotFound(new { success = false, errors = new[] { "Organization not found." } });

        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(request.Name)) errors.Add("Company name is required.");
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

        var systemRole = await _context.SystemRoles.FirstOrDefaultAsync(sr => sr.Slug == "company");

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

        var company = new Company
        {
            OrganizationId = organizationId,
            UserId = user.Id,
            Name = request.Name,
            AdminName = request.AdminName,
            PhoneNumber = request.PhoneNumber,
            Address = request.Address,
            Place = request.Place
        };
        _context.Companies.Add(company);
        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        if (request.Logo != null)
        {
            var path = await _fileStorage.SaveFileAsync(request.Logo, $"companies/{company.Id}");
            company.LogoPath = path;
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, data = new { company.Id, company.Name } });
    }

    [HttpGet]
    public async Task<IActionResult> List(
        int organizationId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 20 : pageSize;

        var query = _context.Companies
            .Include(c => c.User)
            .Where(c => c.OrganizationId == organizationId)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c =>
                EF.Functions.ILike(c.Name, $"%{search}%") ||
                EF.Functions.ILike(c.AdminName, $"%{search}%") ||
                (c.User != null && EF.Functions.ILike(c.User.Email, $"%{search}%")));

        if (isActive.HasValue)
            query = query.Where(c => c.User != null && c.User.IsActive == isActive);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CompanyListItem
            {
                Id = c.Id,
                Name = c.Name,
                AdminName = c.AdminName,
                Email = c.User!.Email,
                PhoneNumber = c.PhoneNumber,
                Place = c.Place,
                LogoUrl = c.LogoPath == null ? null : "/storage/" + c.LogoPath,
                IsActive = c.User.IsActive,
                CreatedAt = c.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = new PagedResult<CompanyListItem>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            }
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int organizationId, int id)
    {
        var company = await _context.Companies
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == organizationId);

        if (company == null || company.User == null)
            return NotFound(new { success = false, errors = new[] { "Company not found." } });

        var detail = new CompanyDetail
        {
            Id = company.Id,
            OrganizationId = company.OrganizationId,
            Name = company.Name,
            AdminName = company.AdminName,
            Email = company.User.Email,
            PhoneNumber = company.PhoneNumber,
            Address = company.Address,
            Place = company.Place,
            LogoUrl = LogoUrl(company.LogoPath),
            IsActive = company.User.IsActive,
            CreatedAt = company.CreatedAt
        };

        return Ok(new { success = true, data = detail });
    }

    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Update(int organizationId, int id, [FromForm] UpdateCompanyRequest request)
    {
        var company = await _context.Companies
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == organizationId);

        if (company == null)
            return NotFound(new { success = false, errors = new[] { "Company not found." } });

        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(request.Name)) errors.Add("Company name is required.");
        if (string.IsNullOrWhiteSpace(request.AdminName)) errors.Add("Admin name is required.");
        if (string.IsNullOrWhiteSpace(request.PhoneNumber)) errors.Add("Phone number is required.");
        if (string.IsNullOrWhiteSpace(request.Address)) errors.Add("Address is required.");
        if (string.IsNullOrWhiteSpace(request.Place)) errors.Add("Place is required.");

        if (errors.Any())
            return BadRequest(new { success = false, errors });

        company.Name = request.Name;
        company.AdminName = request.AdminName;
        company.PhoneNumber = request.PhoneNumber;
        company.Address = request.Address;
        company.Place = request.Place;
        company.UpdatedAt = DateTime.UtcNow;

        if (request.Logo != null)
        {
            _fileStorage.DeleteFile(company.LogoPath);
            company.LogoPath = await _fileStorage.SaveFileAsync(request.Logo, $"companies/{company.Id}");
        }

        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }

    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int organizationId, int id)
    {
        var company = await _context.Companies
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == organizationId);

        if (company?.User == null)
            return NotFound(new { success = false, errors = new[] { "Company not found." } });

        company.User.IsActive = !company.User.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, isActive = company.User.IsActive });
    }
}