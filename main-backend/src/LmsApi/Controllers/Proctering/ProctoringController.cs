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
[Route("api/lms/proctoring")]
public class ProctoringController : BaseController
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;
    public ProctoringController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    // ---- Faculty/admin: course-level configuration ----

    [HttpGet("courses/{courseId}/overview")]
    public async Task<IActionResult> GetCourseOverview(int courseId)
    {
        var moduleIds = await _context.Modules.Where(m => m.CourseId == courseId).Select(m => m.Id).ToListAsync();
        var chapterIds = await _context.Chapters.Where(c => moduleIds.Contains(c.ModuleId)).Select(c => c.Id).ToListAsync();

        var assessments = await _context.Assessments
            .Where(a => a.CourseId == courseId || (a.ModuleId != null && moduleIds.Contains(a.ModuleId.Value)) || (a.ChapterId != null && chapterIds.Contains(a.ChapterId.Value)))
            .ToListAsync();

        var settingsList = await _context.ProctoringSettings
            .Where(p => assessments.Select(a => a.Id).Contains(p.AssessmentId)).ToListAsync();

        var mapItems = new List<AssessmentProctoringMapItem>();
        foreach (var a in assessments)
        {
            string label;
            if (a.CourseId != null) label = "Course Final Assessment";
            else if (a.ModuleId != null)
            {
                var m = await _context.Modules.FindAsync(a.ModuleId.Value);
                label = $"Module: {m?.Name ?? "?"}";
            }
            else
            {
                var c = await _context.Chapters.FindAsync(a.ChapterId!.Value);
                label = $"Chapter: {c?.Name ?? "?"}";
            }
            var existing = settingsList.FirstOrDefault(s => s.AssessmentId == a.Id);
            mapItems.Add(new AssessmentProctoringMapItem { AssessmentId = a.Id, Label = label, IsEnabled = existing?.IsEnabled ?? false });
        }

        var defaultSettings = settingsList.FirstOrDefault();

        return Ok(new
        {
            success = true,
            data = new CourseProctoringOverviewDto
            {
                DefaultSettings = defaultSettings == null ? new ProctoringSettingsDto() : new ProctoringSettingsDto
                {
                    IsEnabled = defaultSettings.IsEnabled,
                    RequireCamera = defaultSettings.RequireCamera,
                    RequireMicrophone = defaultSettings.RequireMicrophone,
                    RecordVideo = defaultSettings.RecordVideo,
                    TakeSnapshots = defaultSettings.TakeSnapshots,
                    SnapshotMode = defaultSettings.SnapshotMode,
                    SnapshotFixedSeconds = defaultSettings.SnapshotFixedSeconds,
                    SnapshotMinSeconds = defaultSettings.SnapshotMinSeconds,
                    SnapshotMaxSeconds = defaultSettings.SnapshotMaxSeconds,
                    BlockCopyPaste = defaultSettings.BlockCopyPaste,
                    BlockTabSwitch = defaultSettings.BlockTabSwitch,
                    BlockRightClick = defaultSettings.BlockRightClick,
                    WarnOnRefreshAttempt = defaultSettings.WarnOnRefreshAttempt,
                    ShowWarningsToStudent = defaultSettings.ShowWarningsToStudent,
                    MaxViolationsBeforeAutoSubmit = defaultSettings.MaxViolationsBeforeAutoSubmit
                },
                Assessments = mapItems
            }
        });
    }

    [HttpPut("courses/{courseId}/apply")]
    public async Task<IActionResult> ApplyCourseProctoring(int courseId, [FromBody] UpdateCourseProctoringRequest request)
    {
        var moduleIds = await _context.Modules.Where(m => m.CourseId == courseId).Select(m => m.Id).ToListAsync();
        var chapterIds = await _context.Chapters.Where(c => moduleIds.Contains(c.ModuleId)).Select(c => c.Id).ToListAsync();

        var assessments = await _context.Assessments
            .Where(a => a.CourseId == courseId || (a.ModuleId != null && moduleIds.Contains(a.ModuleId.Value)) || (a.ChapterId != null && chapterIds.Contains(a.ChapterId.Value)))
            .ToListAsync();

        foreach (var a in assessments)
        {
            var isEnabled = request.EnabledAssessmentIds.Contains(a.Id);
            var existing = await _context.ProctoringSettings.FirstOrDefaultAsync(p => p.AssessmentId == a.Id);
            if (existing == null)
            {
                existing = new ProctoringSettings { AssessmentId = a.Id };
                _context.ProctoringSettings.Add(existing);
            }
            existing.IsEnabled = isEnabled;
            existing.RequireCamera = request.Settings.RequireCamera;
            existing.RequireMicrophone = request.Settings.RequireMicrophone;
            existing.RecordVideo = request.Settings.RecordVideo;
            existing.TakeSnapshots = request.Settings.TakeSnapshots;
            existing.SnapshotMode = request.Settings.SnapshotMode;
            existing.SnapshotFixedSeconds = request.Settings.SnapshotFixedSeconds;
            existing.SnapshotMinSeconds = request.Settings.SnapshotMinSeconds;
            existing.SnapshotMaxSeconds = request.Settings.SnapshotMaxSeconds;
            existing.BlockCopyPaste = request.Settings.BlockCopyPaste;
            existing.BlockTabSwitch = request.Settings.BlockTabSwitch;
            existing.BlockRightClick = request.Settings.BlockRightClick;
            existing.WarnOnRefreshAttempt = request.Settings.WarnOnRefreshAttempt;
            existing.ShowWarningsToStudent = request.Settings.ShowWarningsToStudent;
            existing.MaxViolationsBeforeAutoSubmit = request.Settings.MaxViolationsBeforeAutoSubmit;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ---- Student: fetch settings for the assessment they're about to take ----

    [HttpGet("assessments/{assessmentId}/settings")]
    public async Task<IActionResult> GetSettingsForStudent(int assessmentId)
    {
        var s = await _context.ProctoringSettings.FirstOrDefaultAsync(p => p.AssessmentId == assessmentId && p.IsEnabled);
        if (s == null) return Ok(new { success = true, data = (object?)null }); // proctoring not enabled

        return Ok(new
        {
            success = true,
            data = new ProctoringSettingsDto
            {
                IsEnabled = true,
                RequireCamera = s.RequireCamera,
                RequireMicrophone = s.RequireMicrophone,
                RecordVideo = s.RecordVideo,
                TakeSnapshots = s.TakeSnapshots,
                SnapshotMode = s.SnapshotMode,
                SnapshotFixedSeconds = s.SnapshotFixedSeconds,
                SnapshotMinSeconds = s.SnapshotMinSeconds,
                SnapshotMaxSeconds = s.SnapshotMaxSeconds,
                BlockCopyPaste = s.BlockCopyPaste,
                BlockTabSwitch = s.BlockTabSwitch,
                BlockRightClick = s.BlockRightClick,
                WarnOnRefreshAttempt = s.WarnOnRefreshAttempt,
                ShowWarningsToStudent = s.ShowWarningsToStudent,
                MaxViolationsBeforeAutoSubmit = s.MaxViolationsBeforeAutoSubmit
            }
        });
    }

    // ---- Student: log events, upload snapshots/clips ----

    [HttpPost("attempts/{attemptId}/event")]
    public async Task<IActionResult> LogEvent(int attemptId, [FromBody] ProctoringEventLogRequest request)
    {
        var attempt = await _context.AssessmentAttempts.FindAsync(attemptId);
        if (attempt == null) return NotFound(new { success = false, errors = new[] { "Attempt not found." } });

        _context.ProctoringEvents.Add(new ProctoringEvent
        {
            AttemptId = attemptId,
            EventType = request.EventType,
            Detail = request.Detail
        });
        await _context.SaveChangesAsync();

        var violationCount = await _context.ProctoringEvents.CountAsync(e => e.AttemptId == attemptId &&
            new[] { "tab_switch", "window_blur", "copy", "paste", "right_click", "refresh_attempt" }.Contains(e.EventType));

        var settings = await _context.ProctoringSettings.FirstOrDefaultAsync(p => p.AssessmentId == attempt.AssessmentId);
        var shouldAutoSubmit = settings?.MaxViolationsBeforeAutoSubmit != null && violationCount >= settings.MaxViolationsBeforeAutoSubmit;

        return Ok(new { success = true, data = new { violationCount, shouldAutoSubmit } });
    }

    [HttpPost("attempts/{attemptId}/snapshot")]
    public async Task<IActionResult> UploadSnapshot(int attemptId, [FromForm] IFormFile file)
    {
        var path = await _fileStorage.SaveFileAsync(file, $"proctoring/{attemptId}/snapshots");
        _context.ProctoringEvents.Add(new ProctoringEvent { AttemptId = attemptId, EventType = "snapshot", FilePath = path });
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPost("attempts/{attemptId}/video-clip")]
    public async Task<IActionResult> UploadVideoClip(int attemptId, [FromForm] IFormFile file, [FromForm] string? reason)
    {
        var path = await _fileStorage.SaveFileAsync(file, $"proctoring/{attemptId}/clips");
        _context.ProctoringEvents.Add(new ProctoringEvent { AttemptId = attemptId, EventType = "video_clip", FilePath = path, Detail = reason });
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ---- Faculty: view the report ----

    [HttpGet("attempts/{attemptId}/events")]
    public async Task<IActionResult> GetEvents(int attemptId)
    {
        var events = await _context.ProctoringEvents.Where(e => e.AttemptId == attemptId)
            .OrderBy(e => e.OccurredAt).ToListAsync();

        return Ok(new
        {
            success = true,
            data = events.Select(e => new ProctoringEventDto
            {
                Id = e.Id,
                EventType = e.EventType,
                FilePath = e.FilePath != null ? $"/storage/{e.FilePath}" : null,
                Detail = e.Detail,
                OccurredAt = e.OccurredAt
            })
        });
    }
}