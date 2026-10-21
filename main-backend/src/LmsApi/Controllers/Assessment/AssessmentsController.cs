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
[Route("api/lms/assessments")]
public class AssessmentsController : BaseController
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public AssessmentsController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    [HttpGet("for-entity")]
    public async Task<IActionResult> ForEntity([FromQuery] string entityType, [FromQuery] int entityId)
    {
        var query = _context.Assessments.Include(a => a.Questions).Include(a => a.Grades).AsQueryable();
        query = entityType switch
        {
            "course" => query.Where(a => a.CourseId == entityId),
            "module" => query.Where(a => a.ModuleId == entityId),
            "chapter" => query.Where(a => a.ChapterId == entityId),
            _ => query.Where(a => false)
        };

        var assessment = await query.FirstOrDefaultAsync();
        if (assessment == null) return Ok(new { success = true, data = (AssessmentDto?)null });

        return Ok(new { success = true, data = ToDto(assessment, entityType, entityId) });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var assessment = await _context.Assessments.Include(a => a.Questions).Include(a => a.Grades)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (assessment == null) return NotFound(new { success = false, errors = new[] { "Assessment not found." } });

        var (entityType, entityId) = ResolveEntity(assessment);
        return Ok(new { success = true, data = ToDto(assessment, entityType, entityId) });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AssessmentSettingsRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { success = false, errors = new[] { "Assessment name is required." } });
        if (request.EntityId == null || string.IsNullOrEmpty(request.EntityType))
            return BadRequest(new { success = false, errors = new[] { "Entity reference is required." } });

        var already = await ExistsForEntity(request.EntityType, request.EntityId.Value);
        if (already)
            return BadRequest(new { success = false, errors = new[] { "An assessment already exists for this item." } });

        var assessment = new Assessment
        {
            Name = request.Name.Trim(),
            Description = request.Description,
            Mode = request.Mode,
            IsTimer = request.IsTimer,
            TimerScope = request.TimerScope,
            TimerValue = request.TimerValue,
            TimerUnit = request.TimerUnit,
            QuestionFormat = request.QuestionFormat,
            OptionFormat = request.OptionFormat,
        };

        switch (request.EntityType)
        {
            case "course": assessment.CourseId = request.EntityId; break;
            case "module": assessment.ModuleId = request.EntityId; break;
            case "chapter": assessment.ChapterId = request.EntityId; break;
            default: return BadRequest(new { success = false, errors = new[] { "Invalid entity type." } });
        }

        _context.Assessments.Add(assessment);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = ToDto(assessment, request.EntityType, request.EntityId) });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSettings(int id, [FromBody] AssessmentSettingsRequest request)
    {
        var assessment = await _context.Assessments.Include(a => a.Questions).Include(a => a.Grades)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (assessment == null) return NotFound(new { success = false, errors = new[] { "Assessment not found." } });

        assessment.Name = request.Name.Trim();
        assessment.Description = request.Description;
        assessment.IsTimer = request.IsTimer;
        assessment.TimerScope = request.TimerScope;
        assessment.TimerValue = request.TimerValue;
        assessment.TimerUnit = request.TimerUnit;
        assessment.QuestionFormat = request.QuestionFormat;
        assessment.OptionFormat = request.OptionFormat;
        assessment.UpdatedAt = DateTime.UtcNow;
        // NOTE: Mode is intentionally NOT updated here — mode changes must go through /switch-mode
        // so questions can be safely transferred or wiped with user confirmation.

        await _context.SaveChangesAsync();
        var (entityType, entityId) = ResolveEntity(assessment);
        return Ok(new { success = true, data = ToDto(assessment, entityType, entityId) });
    }

    [HttpPut("{id}/switch-mode")]
    public async Task<IActionResult> SwitchMode(int id, [FromBody] SwitchModeRequest request)
    {
        var assessment = await _context.Assessments
            .Include(a => a.Questions).ThenInclude(q => q.Options)
            .Include(a => a.Questions).ThenInclude(q => q.Media)
            .Include(a => a.Grades)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assessment == null) return NotFound(new { success = false, errors = new[] { "Assessment not found." } });

        if (assessment.Mode != request.Mode)
        {
            if (request.KeepCompatible)
            {
                if (request.Mode == "instant")
                {
                    // Instant mode can't support free-text answers — drop them.
                    var incompatible = assessment.Questions
                        .Where(q => q.QuestionType is "short_answer" or "long_answer").ToList();
                    foreach (var q in incompatible)
                    {
                        foreach (var m in q.Media) _fileStorage.DeleteFile(m.FilePath);
                        _context.AssessmentQuestions.Remove(q);
                    }
                }
                // review mode supports everything instant supports, so nothing to drop going the other way
            }
            else
            {
                foreach (var q in assessment.Questions)
                    foreach (var m in q.Media) _fileStorage.DeleteFile(m.FilePath);

                _context.AssessmentQuestions.RemoveRange(assessment.Questions);
            }

            assessment.Mode = request.Mode;
            assessment.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        var refreshed = await _context.Assessments.Include(a => a.Questions).Include(a => a.Grades)
            .FirstAsync(a => a.Id == id);
        var (entityType, entityId) = ResolveEntity(refreshed);
        return Ok(new { success = true, data = ToDto(refreshed, entityType, entityId) });
    }

    [HttpPost("{id}/publish")]
    public async Task<IActionResult> Publish(int id, [FromBody] PublishAssessmentRequest request)
    {
        var assessment = await _context.Assessments.Include(a => a.Questions).Include(a => a.Grades)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (assessment == null) return NotFound(new { success = false, errors = new[] { "Assessment not found." } });

        if (assessment.Questions.Count == 0)
            return BadRequest(new { success = false, errors = new[] { "Add at least one question before publishing." } });

        if (request.QuestionsToShow != null && request.QuestionsToShow > assessment.Questions.Count)
            return BadRequest(new { success = false, errors = new[] { $"Questions to show cannot exceed total questions ({assessment.Questions.Count})." } });

        assessment.PassPercentage = request.PassPercentage;
        assessment.IsShuffle = request.IsShuffle;
        assessment.QuestionsToShow = request.QuestionsToShow;
        assessment.IsPublished = true;
        assessment.IsDraft = false;
        assessment.UpdatedAt = DateTime.UtcNow;

        _context.AssessmentGrades.RemoveRange(assessment.Grades);
        int order = 0;
        foreach (var g in request.Grades)
        {
            _context.AssessmentGrades.Add(new AssessmentGrade
            {
                AssessmentId = assessment.Id,
                Label = g.Label,
                MinPercentage = g.MinPercentage,
                MaxPercentage = g.MaxPercentage,
                SortOrder = order++
            });
        }

        await _context.SaveChangesAsync();
        var (entityType, entityId) = ResolveEntity(assessment);
        return Ok(new { success = true, data = ToDto(assessment, entityType, entityId) });
    }

    [HttpPut("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var assessment = await _context.Assessments.FindAsync(id);
        if (assessment == null) return NotFound(new { success = false, errors = new[] { "Assessment not found." } });

        assessment.IsActive = !assessment.IsActive;
        assessment.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { isActive = assessment.IsActive } });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var assessment = await _context.Assessments
            .Include(a => a.Questions).ThenInclude(q => q.Media)
            .Include(a => a.Grades)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (assessment == null) return NotFound(new { success = false, errors = new[] { "Assessment not found." } });

        foreach (var q in assessment.Questions)
            foreach (var m in q.Media) _fileStorage.DeleteFile(m.FilePath);

        _context.Assessments.Remove(assessment);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    private async Task<bool> ExistsForEntity(string entityType, int entityId)
    {
        return entityType switch
        {
            "course" => await _context.Assessments.AnyAsync(a => a.CourseId == entityId),
            "module" => await _context.Assessments.AnyAsync(a => a.ModuleId == entityId),
            "chapter" => await _context.Assessments.AnyAsync(a => a.ChapterId == entityId),
            _ => false
        };
    }

    private static (string?, int?) ResolveEntity(Assessment a)
    {
        if (a.CourseId != null) return ("course", a.CourseId);
        if (a.ModuleId != null) return ("module", a.ModuleId);
        if (a.ChapterId != null) return ("chapter", a.ChapterId);
        return (null, null);
    }

    private static AssessmentDto ToDto(Assessment a, string? entityType, int? entityId) => new()
    {
        Id = a.Id,
        EntityType = entityType,
        EntityId = entityId,
        Name = a.Name,
        Description = a.Description,
        Mode = a.Mode,
        IsTimer = a.IsTimer,
        TimerScope = a.TimerScope,
        TimerValue = a.TimerValue,
        TimerUnit = a.TimerUnit,
        QuestionFormat = a.QuestionFormat,
        OptionFormat = a.OptionFormat,
        IsShuffle = a.IsShuffle,
        PassPercentage = a.PassPercentage,
        QuestionsToShow = a.QuestionsToShow,
        IsPublished = a.IsPublished,
        IsActive = a.IsActive,
        QuestionCount = a.Questions?.Count ?? 0,
        Grades = a.Grades?.OrderBy(g => g.SortOrder)
            .Select(g => new AssessmentGradeDto { Id = g.Id, Label = g.Label, MinPercentage = g.MinPercentage, MaxPercentage = g.MaxPercentage })
            .ToList() ?? new()
    };
}