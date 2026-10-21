using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Shared.Services;
using dotnet.Data;
using dotnet.Models;
using dotnet.LmsApi.Dtos;

namespace dotnet.LmsApi.Controllers;

[Authorize]
[Route("api/lms/course-categories")]
public class CourseCategoriesController : BaseController
{
    private readonly AppDbContext _context;
    public CourseCategoriesController(AppDbContext context) { _context = context; }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? search)
    {
        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var query = _context.CourseCategories.Where(c => c.OrganizationId == scope.OrganizationId);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Name.ToLower().Contains(search.ToLower()));

        var items = await query.OrderBy(c => c.Name)
            .Select(c => new CourseCategoryDto { Id = c.Id, Name = c.Name })
            .ToListAsync();

        return Ok(new { success = true, data = items });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CourseCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { success = false, errors = new[] { "Name is required." } });

        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var exists = await _context.CourseCategories.AnyAsync(c =>
            c.OrganizationId == scope.OrganizationId && c.Name.ToLower() == request.Name.Trim().ToLower());
        if (exists) return BadRequest(new { success = false, errors = new[] { "Category already exists." } });

        var category = new CourseCategory { OrganizationId = scope.OrganizationId, Name = request.Name.Trim() };
        _context.CourseCategories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new CourseCategoryDto { Id = category.Id, Name = category.Name } });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CourseCategoryRequest request)
    {
        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var category = await _context.CourseCategories.FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == scope.OrganizationId);
        if (category == null) return NotFound(new { success = false, errors = new[] { "Category not found." } });

        category.Name = request.Name.Trim();
        category.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new CourseCategoryDto { Id = category.Id, Name = category.Name } });
    }
}