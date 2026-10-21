using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Data;
using dotnet.Models;
using dotnet.CentralAdminApi.Dtos;

namespace dotnet.CentralAdminApi.Controllers;

[Authorize]
[Route("api/central/organization-categories")]
public class OrganizationCategoryController : BaseController
{
    private readonly AppDbContext _context;

    public OrganizationCategoryController(AppDbContext context)
    {
        _context = context;
    }

    private static string Slugify(string name) =>
        name.Trim().ToLower().Replace(" ", "-");

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var categories = await _context.OrganizationCategories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryResponse { Id = c.Id, Name = c.Name, Slug = c.Slug })
            .ToListAsync();

        return Ok(new { success = true, data = categories });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { success = false, errors = new[] { "Category name is required." } });

        var slug = Slugify(request.Name);

        var exists = await _context.OrganizationCategories.AnyAsync(c => c.Slug == slug);
        if (exists)
            return BadRequest(new { success = false, errors = new[] { "Category already exists." } });

        var category = new OrganizationCategory { Name = request.Name.Trim(), Slug = slug };
        _context.OrganizationCategories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new CategoryResponse { Id = category.Id, Name = category.Name, Slug = category.Slug } });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryRequest request)
    {
        var category = await _context.OrganizationCategories.FindAsync(id);
        if (category == null)
            return NotFound(new { success = false, errors = new[] { "Category not found." } });

        category.Name = request.Name.Trim();
        category.Slug = Slugify(request.Name);
        category.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new CategoryResponse { Id = category.Id, Name = category.Name, Slug = category.Slug } });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _context.OrganizationCategories.FindAsync(id);
        if (category == null)
            return NotFound(new { success = false, errors = new[] { "Category not found." } });

        var maps = _context.OrganizationCategoryMaps.Where(m => m.OrganizationCategoryId == id);
        _context.OrganizationCategoryMaps.RemoveRange(maps);

        _context.OrganizationCategories.Remove(category);
        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }
}