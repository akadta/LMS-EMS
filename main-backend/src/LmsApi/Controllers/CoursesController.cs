using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Shared.Services;
using dotnet.Data;
using dotnet.Models;
using dotnet.LmsApi.Dtos;
using System.Text.Json;

namespace dotnet.LmsApi.Controllers;

[Authorize]
[Route("api/lms/courses")]
public class CoursesController : BaseController
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public CoursesController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var query = ScopeResolver.ApplyCourseScope(
            _context.Courses.Include(c => c.Images).Include(c => c.Modules)
                .Include(c => c.CategoryMaps).ThenInclude(m => m.CourseCategory)
                .Where(c => c.IsActive), scope);

        var courses = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();

        var data = courses.Select(c => new CourseListItemDto
        {
            Id = c.Id,
            Name = c.Name,
            CoverImageUrl = c.Images.OrderBy(i => i.SortOrder).Select(i => $"/storage/{i.ImagePath}").FirstOrDefault(),
            DifficultyLevel = c.DifficultyLevel,
            IsDraft = c.IsDraft,
            IsFinalAssessment = c.IsFinalAssessment,
            ModuleCount = c.Modules.Count,
            DurationLabel = DurationHelper.Label(c.DurationValue, c.DurationUnit),
            Categories = c.CategoryMaps.Where(m => m.CourseCategory != null).Select(m => m.CourseCategory!.Name).ToList()
        }).ToList();

        return Ok(new { success = true, data });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var course = await _context.Courses
            .Include(c => c.Images)
            .Include(c => c.CategoryMaps).ThenInclude(m => m.CourseCategory)
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == scope.OrganizationId);

        if (course == null) return NotFound(new { success = false, errors = new[] { "Course not found." } });

        var facultyGroups = await _context.CourseFacultyGroups
            .Include(g => g.Members).ThenInclude(m => m.Faculty).ThenInclude(f => f!.SubRole)
            .Where(g => g.CourseId == id)
            .OrderBy(g => g.SortOrder)
            .ToListAsync();

        var dto = new CourseDetailDto
        {
            Id = course.Id,
            Name = course.Name,
            Description = course.Description,
            DurationValue = course.DurationValue,
            DurationUnit = course.DurationUnit,
            DifficultyLevel = course.DifficultyLevel,
            IsFinalAssessment = course.IsFinalAssessment,
            IsDraft = course.IsDraft,
            ImageUrls = course.Images.OrderBy(i => i.SortOrder).Select(i => $"/storage/{i.ImagePath}").ToList(),
            ImageIds = course.Images.OrderBy(i => i.SortOrder).Select(i => i.Id).ToList(),
            Categories = course.CategoryMaps.Where(m => m.CourseCategory != null)
                .Select(m => new CourseCategoryDto { Id = m.CourseCategory!.Id, Name = m.CourseCategory.Name }).ToList(),
            FacultyGroups = facultyGroups.Select(g => new CourseFacultyGroupDto
            {
                Id = g.Id,
                Label = g.Label,
                Faculties = g.Members.Where(m => m.Faculty != null).Select(m => new CourseFacultyMemberDto
                {
                    FacultyId = m.Faculty!.Id,
                    Name = m.Faculty.Name,
                    PhotoUrl = string.IsNullOrEmpty(m.Faculty.PhotoPath) ? null : $"/storage/{m.Faculty.PhotoPath}",
                    SubRoleName = m.Faculty.SubRole != null ? m.Faculty.SubRole.Name : null
                }).ToList()
            }).ToList()
        };

        return Ok(new { success = true, data = dto });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromForm] CourseFormRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { success = false, errors = new[] { "Course name is required." } });

        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var course = new Course
        {
            OrganizationId = scope.OrganizationId,
            CompanyId = scope.CompanyId,
            DepartmentId = scope.DepartmentId,
            Name = request.Name.Trim(),
            Description = request.Description,
            DurationValue = request.DurationValue,
            DurationUnit = request.DurationUnit,
            DifficultyLevel = request.DifficultyLevel ?? "beginner",
            IsFinalAssessment = request.IsFinalAssessment,
            IsDraft = request.IsDraft
        };

        _context.Courses.Add(course);
        await _context.SaveChangesAsync();

        if (request.Images != null)
        {
            int order = 0;
            foreach (var image in request.Images)
            {
                var path = await _fileStorage.SaveFileAsync(image, "courses");
                _context.CourseImages.Add(new CourseImage { CourseId = course.Id, ImagePath = path, SortOrder = order++ });
            }
        }

        if (request.CategoryIds != null)
        {
            foreach (var catId in request.CategoryIds.Distinct())
                _context.CourseCategoryMaps.Add(new CourseCategoryMap { CourseId = course.Id, CourseCategoryId = catId });
        }

        await _context.SaveChangesAsync();

        var newGroups = ParseFacultyGroups(request.FacultyGroupsJson);
        int gOrder = 0;
        foreach (var g in newGroups)
        {
            if (string.IsNullOrWhiteSpace(g.Label)) continue;
            var group = new CourseFacultyGroup { CourseId = course.Id, Label = g.Label.Trim(), SortOrder = gOrder++ };
            _context.CourseFacultyGroups.Add(group);
            await _context.SaveChangesAsync();
            foreach (var fid in g.FacultyIds.Distinct())
                _context.CourseFacultyGroupMembers.Add(new CourseFacultyGroupMember { GroupId = group.Id, FacultyId = fid });
        }
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { id = course.Id } });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromForm] CourseFormRequest request)
    {
        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var course = await _context.Courses
            .Include(c => c.Images)
            .Include(c => c.CategoryMaps)
            .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == scope.OrganizationId);
        if (course == null) return NotFound(new { success = false, errors = new[] { "Course not found." } });

        course.Name = request.Name.Trim();
        course.Description = request.Description;
        course.DurationValue = request.DurationValue;
        course.DurationUnit = request.DurationUnit;
        course.DifficultyLevel = request.DifficultyLevel ?? course.DifficultyLevel;
        course.IsFinalAssessment = request.IsFinalAssessment;
        course.IsDraft = request.IsDraft;
        course.UpdatedAt = DateTime.UtcNow;

        // remove images not kept
        var keepIds = request.KeepImageIds ?? new List<int>();
        var toRemove = course.Images.Where(i => !keepIds.Contains(i.Id)).ToList();
        foreach (var img in toRemove)
        {
            _fileStorage.DeleteFile(img.ImagePath);
            _context.CourseImages.Remove(img);
        }

        if (request.Images != null)
        {
            int order = course.Images.Count(i => keepIds.Contains(i.Id));
            foreach (var image in request.Images)
            {
                var path = await _fileStorage.SaveFileAsync(image, "courses");
                _context.CourseImages.Add(new CourseImage { CourseId = course.Id, ImagePath = path, SortOrder = order++ });
            }
        }

        _context.CourseCategoryMaps.RemoveRange(course.CategoryMaps);
        if (request.CategoryIds != null)
        {
            foreach (var catId in request.CategoryIds.Distinct())
                _context.CourseCategoryMaps.Add(new CourseCategoryMap { CourseId = course.Id, CourseCategoryId = catId });
        }

        await _context.SaveChangesAsync();

        var existingGroups = await _context.CourseFacultyGroups.Include(g => g.Members)
            .Where(g => g.CourseId == course.Id).ToListAsync();
        foreach (var g in existingGroups)
        {
            _context.CourseFacultyGroupMembers.RemoveRange(g.Members);
            _context.CourseFacultyGroups.Remove(g);
        }
        await _context.SaveChangesAsync();

        var newGroups = ParseFacultyGroups(request.FacultyGroupsJson);
        int gOrder = 0;
        foreach (var g in newGroups)
        {
            if (string.IsNullOrWhiteSpace(g.Label)) continue;
            var group = new CourseFacultyGroup { CourseId = course.Id, Label = g.Label.Trim(), SortOrder = gOrder++ };
            _context.CourseFacultyGroups.Add(group);
            await _context.SaveChangesAsync();
            foreach (var fid in g.FacultyIds.Distinct())
                _context.CourseFacultyGroupMembers.Add(new CourseFacultyGroupMember { GroupId = group.Id, FacultyId = fid });
        }
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { id = course.Id } });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var course = await _context.Courses.FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == scope.OrganizationId);
        if (course == null) return NotFound(new { success = false, errors = new[] { "Course not found." } });

        course.IsActive = false;
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    private static List<CourseFacultyGroupRequest> ParseFacultyGroups(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try
        {
            return JsonSerializer.Deserialize<List<CourseFacultyGroupRequest>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
        }
        catch { return new(); }
    }
}

public class CourseFormRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DurationValue { get; set; }
    public string? DurationUnit { get; set; }
    public string? DifficultyLevel { get; set; }
    public bool IsFinalAssessment { get; set; }
    public bool IsDraft { get; set; } = true;
    public List<int>? CategoryIds { get; set; }
    public List<IFormFile>? Images { get; set; }
    public List<int>? KeepImageIds { get; set; }
    public string? FacultyGroupsJson { get; set; } // JSON-encoded List<CourseFacultyGroupRequest>
}

