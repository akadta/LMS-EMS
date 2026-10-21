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
[Route("api/lms/modules")]
public class ModulesController : BaseController
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public ModulesController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int courseId)
    {
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) return NotFound(new { success = false, errors = new[] { "Course not found." } });

        var modules = await _context.Modules.Include(m => m.Chapters)
            .Where(m => m.CourseId == courseId)
            .OrderBy(m => m.SortOrder).ThenBy(m => m.Id)
            .ToListAsync();

        var data = modules.Select(m => new ModuleListItemDto
        {
            Id = m.Id,
            CourseId = m.CourseId,
            Name = m.Name,
            ImageUrl = string.IsNullOrEmpty(m.ImagePath) ? null : $"/storage/{m.ImagePath}",
            DifficultyLevel = m.DifficultyLevel,
            DurationLabel = DurationHelper.Label(m.DurationValue, m.DurationUnit),
            IsLock = m.IsLock,
            IsFinalAssessment = m.IsFinalAssessment,
            IsDraft = m.IsDraft,
            ChapterCount = m.Chapters.Count
        }).ToList();

        return Ok(new { success = true, data = new { course = new { course.Id, course.Name, course.DurationValue, course.DurationUnit }, modules = data } });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var module = await _context.Modules.FirstOrDefaultAsync(m => m.Id == id);
        if (module == null) return NotFound(new { success = false, errors = new[] { "Module not found." } });

        var remaining = await RemainingDurationDays(module.CourseId, excludeModuleId: module.Id);

        var dto = new ModuleDetailDto
        {
            Id = module.Id,
            CourseId = module.CourseId,
            Name = module.Name,
            Description = module.Description,
            ImageUrl = string.IsNullOrEmpty(module.ImagePath) ? null : $"/storage/{module.ImagePath}",
            DifficultyLevel = module.DifficultyLevel,
            DurationValue = module.DurationValue,
            DurationUnit = module.DurationUnit,
            IsLock = module.IsLock,
            IsFinalAssessment = module.IsFinalAssessment,
            IsDraft = module.IsDraft,
            IsPass = module.IsPass,
            IsReviewUnlock = module.IsReviewUnlock,
            RemainingCourseDurationDays = remaining
        };

        return Ok(new { success = true, data = dto });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromForm] ModuleFormRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { success = false, errors = new[] { "Module name is required." } });

        var course = await _context.Courses.FindAsync(request.CourseId);
        if (course == null) return NotFound(new { success = false, errors = new[] { "Course not found." } });

        var durationDays = DurationHelper.ToDays(request.DurationValue, request.DurationUnit);
        if (durationDays > 0)
        {
            var remaining = await RemainingDurationDays(request.CourseId, excludeModuleId: null);
            if (remaining > 0 && durationDays > remaining)
                return BadRequest(new { success = false, errors = new[] { $"Duration exceeds remaining course duration ({remaining} days left)." } });
        }

        string? imagePath = null;
        if (request.Image != null)
            imagePath = await _fileStorage.SaveFileAsync(request.Image, "modules");

        var sortOrder = await _context.Modules.Where(m => m.CourseId == request.CourseId).CountAsync();

        var module = new CourseModule
        {
            CourseId = request.CourseId,
            Name = request.Name.Trim(),
            Description = request.Description,
            ImagePath = imagePath,
            DifficultyLevel = request.DifficultyLevel ?? "beginner",
            DurationValue = request.DurationValue,
            DurationUnit = request.DurationUnit,
            DurationDays = durationDays,
            IsLock = request.IsLock,
            IsFinalAssessment = request.IsFinalAssessment,
            IsDraft = request.IsDraft,
            SortOrder = sortOrder,
            IsPass = request.IsPass,
            IsReviewUnlock = request.IsReviewUnlock,
        };

        _context.Modules.Add(module);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = new { id = module.Id } });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromForm] ModuleFormRequest request)
    {
        var module = await _context.Modules.FirstOrDefaultAsync(m => m.Id == id);
        if (module == null) return NotFound(new { success = false, errors = new[] { "Module not found." } });

        var durationDays = DurationHelper.ToDays(request.DurationValue, request.DurationUnit);
        if (durationDays > 0)
        {
            var remaining = await RemainingDurationDays(module.CourseId, excludeModuleId: module.Id);
            if (remaining > 0 && durationDays > remaining)
                return BadRequest(new { success = false, errors = new[] { $"Duration exceeds remaining course duration ({remaining} days left)." } });
        }

        if (request.Image != null)
        {
            if (!string.IsNullOrEmpty(module.ImagePath)) _fileStorage.DeleteFile(module.ImagePath);
            module.ImagePath = await _fileStorage.SaveFileAsync(request.Image, "modules");
        }
        else if (request.RemoveImage)
        {
            if (!string.IsNullOrEmpty(module.ImagePath)) _fileStorage.DeleteFile(module.ImagePath);
            module.ImagePath = null;
        }

        module.Name = request.Name.Trim();
        module.Description = request.Description;
        module.DifficultyLevel = request.DifficultyLevel ?? module.DifficultyLevel;
        module.DurationValue = request.DurationValue;
        module.DurationUnit = request.DurationUnit;
        module.DurationDays = durationDays;
        module.IsLock = request.IsLock;
        module.IsFinalAssessment = request.IsFinalAssessment;
        module.IsDraft = request.IsDraft;
        module.UpdatedAt = DateTime.UtcNow;
        module.IsPass = request.IsPass;
        module.IsReviewUnlock = request.IsReviewUnlock;

        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = new { id = module.Id } });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var module = await _context.Modules.FirstOrDefaultAsync(m => m.Id == id);
        if (module == null) return NotFound(new { success = false, errors = new[] { "Module not found." } });

        if (!string.IsNullOrEmpty(module.ImagePath)) _fileStorage.DeleteFile(module.ImagePath);
        _context.Modules.Remove(module);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    private async Task<int> RemainingDurationDays(int courseId, int? excludeModuleId)
    {
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) return 0;
        var totalDays = DurationHelper.ToDays(course.DurationValue, course.DurationUnit);
        if (totalDays == 0) return 0;

        var usedDays = await _context.Modules
            .Where(m => m.CourseId == courseId && (excludeModuleId == null || m.Id != excludeModuleId))
            .SumAsync(m => (int?)m.DurationDays) ?? 0;

        return Math.Max(totalDays - usedDays, 0);
    }

    [HttpPut("{id}/gating")]
    public async Task<IActionResult> UpdateGating(int id, [FromBody] ModuleGatingRequest request)
    {
        var module = await _context.Modules.FirstOrDefaultAsync(m => m.Id == id);
        if (module == null) return NotFound(new { success = false, errors = new[] { "Module not found." } });

        module.IsPass = request.IsPass;
        module.IsReviewUnlock = request.IsReviewUnlock;
        module.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { module.IsPass, module.IsReviewUnlock } });
    }
}

public class ModuleFormRequest
{
    public int CourseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public IFormFile? Image { get; set; }
    public bool RemoveImage { get; set; }
    public string? DifficultyLevel { get; set; }
    public int? DurationValue { get; set; }
    public string? DurationUnit { get; set; }
    public bool IsLock { get; set; }
    public bool IsFinalAssessment { get; set; }
    public bool IsDraft { get; set; } = true;
    public bool IsPass { get; set; }
    public bool IsReviewUnlock { get; set; }
}