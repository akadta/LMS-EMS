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
[Route("api/central/organizations")]
public class OrganizationController : BaseController
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public OrganizationController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    private static string? LogoUrl(string? path) =>
        string.IsNullOrEmpty(path) ? null : $"/storage/{path}";

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Create([FromForm] CreateOrganizationRequest request)
    {
        var errors = new List<string>();

        if (string.IsNullOrWhiteSpace(request.Name)) errors.Add("Organization name is required.");
        if (string.IsNullOrWhiteSpace(request.Email)) errors.Add("Email is required.");
        if (string.IsNullOrWhiteSpace(request.Password)) errors.Add("Password is required.");
        if (request.Password != request.ConfirmPassword) errors.Add("Passwords do not match.");
        if (!request.IsLms && !request.IsEms) errors.Add("Select at least LMS or EMS.");

        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            errors.Add("Email is already in use.");

        if (errors.Any())
            return BadRequest(new { success = false, errors });

        var systemRole = await _context.SystemRoles.FirstOrDefaultAsync(sr => sr.Slug == "organization");
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Slug == "org_owner");

        using var transaction = await _context.Database.BeginTransactionAsync();

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
            SystemRoleId = systemRole?.Id,
            RoleId = role?.Id,
            IsActive = true
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // inside Create(...)
        var organization = new Organization
        {
            UserId = user.Id,
            Name = request.Name,
            PhoneNumber = request.PhoneNumber,
            ThemeColor = string.IsNullOrWhiteSpace(request.ThemeColor) ? "#6366f1" : request.ThemeColor,
            SidebarColor = string.IsNullOrWhiteSpace(request.SidebarColor) ? "#0e1220" : request.SidebarColor,
            HeaderColor = string.IsNullOrWhiteSpace(request.HeaderColor) ? "#0a0d16" : request.HeaderColor,
            IsLms = request.IsLms,
            IsEms = request.IsEms
        };
        _context.Organizations.Add(organization);
        await _context.SaveChangesAsync();

        var sortOrder = 0;
        foreach (var line in request.Addresses.Where(a => !string.IsNullOrWhiteSpace(a)))
        {
            _context.OrganizationAddresses.Add(new OrganizationAddress
            {
                OrganizationId = organization.Id,
                Line = line.Trim(),
                SortOrder = sortOrder++
            });
        }

        foreach (var categoryId in request.CategoryIds.Distinct())
        {
            _context.OrganizationCategoryMaps.Add(new OrganizationCategoryMap
            {
                OrganizationId = organization.Id,
                OrganizationCategoryId = categoryId
            });
        }

        await _context.SaveChangesAsync();
        await transaction.CommitAsync();

        if (request.Logo != null)
        {
            var path = await _fileStorage.SaveFileAsync(request.Logo, $"organizations/{organization.Id}");
            organization.LogoPath = path;
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, data = new { organization.Id, organization.Name } });
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] bool? isActive = null)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize is < 1 or > 200 ? 20 : pageSize;

        var query = _context.Organizations
            .Include(o => o.User)
            .Include(o => o.CategoryMaps).ThenInclude(m => m.Category)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(o =>
                EF.Functions.ILike(o.Name, $"%{search}%") ||
                (o.User != null && EF.Functions.ILike(o.User.Email, $"%{search}%")));

        if (categoryId.HasValue)
            query = query.Where(o => o.CategoryMaps.Any(m => m.OrganizationCategoryId == categoryId));

        if (isActive.HasValue)
            query = query.Where(o => o.User != null && o.User.IsActive == isActive);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new OrganizationListItem
            {
                Id = o.Id,
                Name = o.Name,
                Email = o.User!.Email,
                PhoneNumber = o.PhoneNumber,
                LogoUrl = o.LogoPath == null ? null : "/storage/" + o.LogoPath,
                IsActive = o.User.IsActive,
                IsLms = o.IsLms,
                IsEms = o.IsEms,
                Categories = o.CategoryMaps.Select(m => m.Category!.Name).ToList(),
                CreatedAt = o.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            data = new PagedResult<OrganizationListItem>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            }
        });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var org = await _context.Organizations
            .Include(o => o.User)
            .Include(o => o.Addresses)
            .Include(o => o.CategoryMaps).ThenInclude(m => m.Category)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (org == null || org.User == null)
            return NotFound(new { success = false, errors = new[] { "Organization not found." } });

        // inside GetById(...)
        var detail = new OrganizationDetail
        {
            Id = org.Id,
            Name = org.Name,
            Email = org.User.Email,
            PhoneNumber = org.PhoneNumber,
            LogoUrl = LogoUrl(org.LogoPath),
            ThemeColor = org.ThemeColor,
            SidebarColor = org.SidebarColor,
            HeaderColor = org.HeaderColor,
            IsActive = org.User.IsActive,
            IsLms = org.IsLms,
            IsEms = org.IsEms,
            Addresses = org.Addresses.OrderBy(a => a.SortOrder).Select(a => a.Line).ToList(),
            CategoryIds = org.CategoryMaps.Select(m => m.OrganizationCategoryId).ToList(),
            Categories = org.CategoryMaps.Select(m => m.Category!.Name).ToList(),
            CreatedAt = org.CreatedAt
        };

        return Ok(new { success = true, data = detail });
    }

    [HttpPut("{id}")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Update(int id, [FromForm] UpdateOrganizationRequest request)
    {
        var org = await _context.Organizations
            .Include(o => o.Addresses)
            .Include(o => o.CategoryMaps)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (org == null)
            return NotFound(new { success = false, errors = new[] { "Organization not found." } });

        if (!request.IsLms && !request.IsEms)
            return BadRequest(new { success = false, errors = new[] { "Select at least LMS or EMS." } });

        // inside Update(...)
        org.Name = request.Name;
        org.PhoneNumber = request.PhoneNumber;
        org.ThemeColor = string.IsNullOrWhiteSpace(request.ThemeColor) ? org.ThemeColor : request.ThemeColor;
        org.SidebarColor = string.IsNullOrWhiteSpace(request.SidebarColor) ? org.SidebarColor : request.SidebarColor;
        org.HeaderColor = string.IsNullOrWhiteSpace(request.HeaderColor) ? org.HeaderColor : request.HeaderColor;
        org.IsLms = request.IsLms;
        org.IsEms = request.IsEms;
        org.UpdatedAt = DateTime.UtcNow;

        _context.OrganizationAddresses.RemoveRange(org.Addresses);
        var sortOrder = 0;
        foreach (var line in request.Addresses.Where(a => !string.IsNullOrWhiteSpace(a)))
        {
            _context.OrganizationAddresses.Add(new OrganizationAddress
            {
                OrganizationId = org.Id,
                Line = line.Trim(),
                SortOrder = sortOrder++
            });
        }

        _context.OrganizationCategoryMaps.RemoveRange(org.CategoryMaps);
        foreach (var categoryId in request.CategoryIds.Distinct())
        {
            _context.OrganizationCategoryMaps.Add(new OrganizationCategoryMap
            {
                OrganizationId = org.Id,
                OrganizationCategoryId = categoryId
            });
        }

        if (request.Logo != null)
        {
            _fileStorage.DeleteFile(org.LogoPath);
            org.LogoPath = await _fileStorage.SaveFileAsync(request.Logo, $"organizations/{org.Id}");
        }

        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }

    [HttpPatch("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var org = await _context.Organizations.Include(o => o.User).FirstOrDefaultAsync(o => o.Id == id);
        if (org?.User == null)
            return NotFound(new { success = false, errors = new[] { "Organization not found." } });

        org.User.IsActive = !org.User.IsActive;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, isActive = org.User.IsActive });
    }
}