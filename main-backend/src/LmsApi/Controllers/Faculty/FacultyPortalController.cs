using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Data;
using dotnet.Models;
using dotnet.LmsApi.Dtos;

namespace dotnet.LmsApi.Controllers;

[Authorize]
[Route("api/faculty/portal")]
public class FacultyPortalController : BaseController
{
    private readonly AppDbContext _context;
    public FacultyPortalController(AppDbContext context) { _context = context; }

    private async Task<Faculty?> CurrentFaculty() =>
        await _context.Faculties.FirstOrDefaultAsync(f => f.UserId == CurrentUserId);

    private async Task<List<int>> FacultyCourseIds(int facultyId) =>
        await _context.CourseFacultyGroupMembers.Where(m => m.FacultyId == facultyId)
            .Join(_context.CourseFacultyGroups, m => m.GroupId, g => g.Id, (m, g) => g.CourseId)
            .Distinct().ToListAsync();

    private async Task<HashSet<int>> GetReviewGatedAssessmentIds(List<int> assessmentIds)
    {
        var assessments = await _context.Assessments.Where(a => assessmentIds.Contains(a.Id)).ToListAsync();
        var result = new HashSet<int>();

        foreach (var a in assessments)
        {
            bool reviewRequired = false;
            if (a.ModuleId != null)
            {
                var m = await _context.Modules.FindAsync(a.ModuleId.Value);
                reviewRequired = m?.IsReviewUnlock ?? false;
            }
            else if (a.ChapterId != null)
            {
                var c = await _context.Chapters.FindAsync(a.ChapterId.Value);
                reviewRequired = c?.IsReviewUnlock ?? false;
            }
            if (reviewRequired) result.Add(a.Id);
        }
        return result;
    }

    [HttpGet("batches")]
    public async Task<IActionResult> GetBatches()
    {
        var faculty = await CurrentFaculty();
        if (faculty == null) return Unauthorized(new { success = false, errors = new[] { "Not faculty." } });

        var courseIds = await FacultyCourseIds(faculty.Id);
        var batchCourses = await _context.BatchCourses.Include(bc => bc.Batch).Include(bc => bc.Course)
            .Include(bc => bc.AllocatedStudents)
            .Where(bc => courseIds.Contains(bc.CourseId)).ToListAsync();

        var data = batchCourses.Select(bc => new FacultyBatchCourseDto
        {
            BatchCourseId = bc.Id,
            BatchId = bc.BatchId,
            BatchName = bc.Batch?.Name ?? "",
            CourseId = bc.CourseId,
            CourseName = bc.Course?.Name ?? "",
            AllocatedStudentCount = bc.AllocatedStudents.Count
        }).ToList();

        return Ok(new { success = true, data });
    }

    [HttpGet("batch-courses/{batchCourseId}/students")]
    public async Task<IActionResult> GetStudentTracking(int batchCourseId)
    {
        var bc = await _context.BatchCourses.Include(x => x.AllocatedStudents).ThenInclude(a => a.Student)
            .FirstOrDefaultAsync(x => x.Id == batchCourseId);
        if (bc == null) return NotFound(new { success = false, errors = new[] { "Not found." } });

        var modules = await _context.Modules.Where(m => m.CourseId == bc.CourseId && !m.IsDraft).OrderBy(m => m.SortOrder).ToListAsync();
        var totalModules = modules.Count;

        var data = new List<FacultyStudentTrackingDto>();
        foreach (var alloc in bc.AllocatedStudents)
        {
            var student = alloc.Student;
            if (student == null) continue;

            var completedModuleIds = await _context.StudentModuleProgress.Where(p => p.StudentId == student.Id).Select(p => p.ModuleId).ToListAsync();
            var modulesCompleted = modules.Count(m => completedModuleIds.Contains(m.Id));

            string? currentModuleName = null, currentChapterName = null;
            var currentModule = modules.FirstOrDefault(m => !completedModuleIds.Contains(m.Id));
            if (currentModule != null)
            {
                currentModuleName = currentModule.Name;
                var chapters = await _context.Chapters.Where(c => c.ModuleId == currentModule.Id && !c.IsDraft).OrderBy(c => c.SortOrder).ToListAsync();
                var completedChapterIds = await _context.StudentChapterProgress.Where(p => p.StudentId == student.Id).Select(p => p.ChapterId).ToListAsync();
                currentChapterName = chapters.FirstOrDefault(c => !completedChapterIds.Contains(c.Id))?.Name ?? chapters.LastOrDefault()?.Name;
            }

bool isBlocked = false;
bool hasPending = false;
if (currentModule != null)
{
    int? gateAssessmentId = null;
    if (currentModule.IsFinalAssessment)
    {
        var a = await _context.Assessments.FirstOrDefaultAsync(x => x.ModuleId == currentModule.Id && x.IsPublished && x.IsActive);
        gateAssessmentId = a?.Id;
    }
    var (gateCleared, reason) = await Shared.Services.GatingHelper.IsGateClearedAsync(
        _context, student.Id, currentModule.IsFinalAssessment, currentModule.IsPass, currentModule.IsReviewUnlock, gateAssessmentId);
    isBlocked = !gateCleared && reason == "failed_pending_override";
    hasPending = !gateCleared && reason == "pending_review";
}
            data.Add(new FacultyStudentTrackingDto
            {
                StudentId = student.Id,
                Name = student.Name,
                PhotoUrl = string.IsNullOrEmpty(student.PhotoPath) ? null : $"/storage/{student.PhotoPath}",
                CurrentModuleName = currentModuleName,
                CurrentChapterName = currentChapterName,
                ModulesCompleted = modulesCompleted,
                TotalModules = totalModules,
                HasPendingReview = hasPending,
                IsBlockedOnOverride = isBlocked
            });
        }
        return Ok(new { success = true, data });
    }

    [HttpGet("review-queue/courses")]
    public async Task<IActionResult> GetReviewQueueCourses()
    {
        var faculty = await CurrentFaculty();
        if (faculty == null) return Unauthorized(new { success = false, errors = new[] { "Not faculty." } });

        var courseIds = await FacultyCourseIds(faculty.Id);
        var moduleIds = await _context.Modules.Where(m => courseIds.Contains(m.CourseId)).Select(m => m.Id).ToListAsync();
        var chapterIds = await _context.Chapters.Where(c => moduleIds.Contains(c.ModuleId)).Select(c => c.Id).ToListAsync();

        var assessments = await _context.Assessments
            .Where(a => (a.CourseId != null && courseIds.Contains(a.CourseId.Value))
                     || (a.ModuleId != null && moduleIds.Contains(a.ModuleId.Value))
                     || (a.ChapterId != null && chapterIds.Contains(a.ChapterId.Value)))
            .ToListAsync();
        var assessmentIds = assessments.Select(a => a.Id).ToList();

        var reviewGatedAssessmentIds = await GetReviewGatedAssessmentIds(assessmentIds);

        var pendingAttempts = await _context.AssessmentAttempts
            .Where(a => assessmentIds.Contains(a.AssessmentId) &&
                (a.Status == "grading" ||
                 (a.Mode == "instant" && a.Status == "graded" && reviewGatedAssessmentIds.Contains(a.AssessmentId))))
            .ToListAsync();

        var batchCourses = await _context.BatchCourses.Include(bc => bc.Batch).Include(bc => bc.Course)
            .Where(bc => courseIds.Contains(bc.CourseId)).ToListAsync();

        var data = new List<ReviewQueueCourseDto>();
        foreach (var bc in batchCourses)
        {
            var courseAssessmentIds = assessments.Where(a => a.CourseId == bc.CourseId
                || (a.ModuleId != null && _context.Modules.Any(m => m.Id == a.ModuleId && m.CourseId == bc.CourseId))
                || (a.ChapterId != null && _context.Chapters.Any(c => c.Id == a.ChapterId && moduleIds.Contains(c.ModuleId) &&
                    _context.Modules.Any(m => m.Id == c.ModuleId && m.CourseId == bc.CourseId))))
                .Select(a => a.Id).ToList();

            var count = pendingAttempts.Count(a => courseAssessmentIds.Contains(a.AssessmentId));
            if (count == 0) continue;

            data.Add(new ReviewQueueCourseDto
            {
                BatchCourseId = bc.Id,
                BatchName = bc.Batch?.Name ?? "",
                CourseName = bc.Course?.Name ?? "",
                PendingCount = count
            });
        }

        return Ok(new { success = true, data });
    }

    [HttpGet("review-queue/batch-courses/{batchCourseId}/students")]
    public async Task<IActionResult> GetReviewQueueStudents(int batchCourseId, [FromQuery] string? search)
    {
        var faculty = await CurrentFaculty();
        if (faculty == null) return Unauthorized(new { success = false, errors = new[] { "Not faculty." } });

        var bc = await _context.BatchCourses.Include(x => x.AllocatedStudents).ThenInclude(a => a.Student)
            .FirstOrDefaultAsync(x => x.Id == batchCourseId);
        if (bc == null) return NotFound(new { success = false, errors = new[] { "Not found." } });

        var moduleIds = await _context.Modules.Where(m => m.CourseId == bc.CourseId).Select(m => m.Id).ToListAsync();
        var chapterIds = await _context.Chapters.Where(c => moduleIds.Contains(c.ModuleId)).Select(c => c.Id).ToListAsync();
        var assessmentIds = await _context.Assessments
            .Where(a => a.CourseId == bc.CourseId
                     || (a.ModuleId != null && moduleIds.Contains(a.ModuleId.Value))
                     || (a.ChapterId != null && chapterIds.Contains(a.ChapterId.Value)))
            .Select(a => a.Id).ToListAsync();

        var reviewGatedAssessmentIds = await GetReviewGatedAssessmentIds(assessmentIds);

        var pendingByStudent = await _context.AssessmentAttempts
            .Where(a => assessmentIds.Contains(a.AssessmentId) &&
                (a.Status == "grading" ||
                 (a.Mode == "instant" && a.Status == "graded" && reviewGatedAssessmentIds.Contains(a.AssessmentId))))
            .GroupBy(a => a.StudentId)
                    .Select(g => new { StudentId = g.Key, Count = g.Count() })
                    .ToListAsync();

        var data = new List<ReviewQueueStudentDto>();
        foreach (var alloc in bc.AllocatedStudents)
        {
            var student = alloc.Student;
            if (student == null) continue;
            var pending = pendingByStudent.FirstOrDefault(p => p.StudentId == student.Id);
            if (pending == null) continue;
            if (!string.IsNullOrWhiteSpace(search) && !student.Name.Contains(search, StringComparison.OrdinalIgnoreCase)) continue;

            data.Add(new ReviewQueueStudentDto
            {
                StudentId = student.Id,
                Name = student.Name,
                PhotoUrl = string.IsNullOrEmpty(student.PhotoPath) ? null : $"/storage/{student.PhotoPath}",
                PendingCount = pending.Count
            });
        }

        return Ok(new { success = true, data = data.OrderByDescending(d => d.PendingCount) });
    }

    [HttpGet("attempts/{attemptId}")]
    public async Task<IActionResult> GetAttemptDetail(int attemptId)
    {
        var attempt = await _context.AssessmentAttempts.Include(a => a.Student).Include(a => a.Answers)
            .FirstOrDefaultAsync(a => a.Id == attemptId);
        if (attempt == null) return NotFound(new { success = false, errors = new[] { "Not found." } });

        var assessment = await _context.Assessments.FindAsync(attempt.AssessmentId);
        var questions = await _context.AssessmentQuestions.Include(q => q.Options)
            .Where(q => q.AssessmentId == attempt.AssessmentId).ToListAsync();

        var answers = attempt.Answers.Select(ans =>
        {
            var q = questions.FirstOrDefault(x => x.Id == ans.QuestionId);
            return new AttemptAnswerForFacultyDto
            {
                AnswerId = ans.Id,
                QuestionId = ans.QuestionId,
                QuestionText = q?.QuestionText ?? "",
                QuestionType = q?.QuestionType ?? "",
                MaxMark = q?.MarkingMode == "per_option" ? q.Options.Where(o => o.IsCorrect).Sum(o => o.Mark ?? 0) : q?.Mark,
                SelectedOptionIds = string.IsNullOrEmpty(ans.SelectedOptionIdsJson) ? null : JsonSerializer.Deserialize<List<int>>(ans.SelectedOptionIdsJson),
                TextAnswer = ans.TextAnswer,
                MarkAwarded = ans.MarkAwarded,
                FacultyNote = ans.FacultyNote,
                Options = q?.Options.Select(o => new AttemptOptionInfoDto { Id = o.Id, OptionText = o.OptionText, IsCorrect = o.IsCorrect }).ToList() ?? new()
            };
        }).ToList();

        return Ok(new
        {
            success = true,
data = new AttemptDetailForFacultyDto
{
    AttemptId = attempt.Id,
    StudentName = attempt.Student?.Name ?? "",
    AssessmentName = assessment?.Name ?? "",
    Mode = attempt.Mode,
    Status = attempt.Status,
    Passed = attempt.Passed,
    Percent = attempt.Percent,
    Answers = answers,
    CanOverride = attempt.Mode == "instant" && attempt.Passed == false,
    AlreadyOverridden = attempt.FacultyOverrideUnlock
}
        });
    }

   [HttpPut("attempts/{attemptId}/answers/{answerId}/grade")]
public async Task<IActionResult> GradeAnswer(int attemptId, int answerId, [FromBody] GradeAnswerRequest request)
{
    var attempt = await _context.AssessmentAttempts.FindAsync(attemptId);
    if (attempt?.Status == "approved")
        return BadRequest(new { success = false, errors = new[] { "This attempt is already approved and locked." } });

    var answer = await _context.AssessmentAttemptAnswers.FirstOrDefaultAsync(a => a.Id == answerId && a.AttemptId == attemptId);
    if (answer == null) return NotFound(new { success = false, errors = new[] { "Answer not found." } });

    var question = await _context.AssessmentQuestions.Include(q => q.Options).FirstOrDefaultAsync(q => q.Id == answer.QuestionId);
    var maxMark = question?.MarkingMode == "per_option"
        ? question.Options.Where(o => o.IsCorrect).Sum(o => o.Mark ?? 0)
        : question?.Mark ?? 0;

    if (request.MarkAwarded < 0)
        return BadRequest(new { success = false, errors = new[] { "Mark cannot be negative." } });
    if (request.MarkAwarded > maxMark)
        return BadRequest(new { success = false, errors = new[] { $"Mark cannot exceed the maximum of {maxMark} for this question." } });

    answer.MarkAwarded = request.MarkAwarded;
    answer.FacultyNote = request.FacultyNote;
    await _context.SaveChangesAsync();
    return Ok(new { success = true });
}

    [HttpPost("attempts/{attemptId}/approve")]
    public async Task<IActionResult> ApproveAttempt(int attemptId, [FromBody] ApproveAttemptRequest request)
    {
        var faculty = await CurrentFaculty();
        if (faculty == null) return Unauthorized(new { success = false, errors = new[] { "Not faculty." } });

        var attempt = await _context.AssessmentAttempts.Include(a => a.Answers).FirstOrDefaultAsync(a => a.Id == attemptId);
        if (attempt == null) return NotFound(new { success = false, errors = new[] { "Not found." } });

        if (attempt.Mode == "instant")
        {
            attempt.Status = request.Approve ? "approved" : "graded";
            if (request.Approve)
            {
                attempt.ReviewedByFacultyId = faculty.Id;
                attempt.ReviewedAt = DateTime.UtcNow;
            }
            await _context.SaveChangesAsync();
            return Ok(new { success = true, data = new { attempt.Status, attempt.TotalPossible, attempt.TotalAwarded, attempt.Percent, attempt.Passed, attempt.Grade } });
        }

        if (request.Approve)
        {
            var totalPossible = attempt.Answers.Sum(a => (double?)0) ?? 0; // computed below properly
            var questions = await _context.AssessmentQuestions.Where(q => q.AssessmentId == attempt.AssessmentId).ToListAsync();
            double possible = 0, awarded = 0;
            foreach (var ans in attempt.Answers)
            {
                var q = questions.FirstOrDefault(x => x.Id == ans.QuestionId);
                possible += q?.Mark ?? 0;
                awarded += ans.MarkAwarded ?? 0;
            }
            var assessment = await _context.Assessments.Include(a => a.Grades).FirstOrDefaultAsync(a => a.Id == attempt.AssessmentId);
            var percent = possible > 0 ? Math.Round((awarded / possible) * 100, 2) : 0;

            attempt.TotalPossible = possible; attempt.TotalAwarded = awarded; attempt.Percent = percent;
            attempt.Passed = assessment?.PassPercentage != null ? percent >= assessment.PassPercentage : (bool?)null;
            attempt.Grade = assessment?.Grades.OrderBy(g => g.SortOrder).FirstOrDefault(g => percent >= g.MinPercentage && percent <= g.MaxPercentage)?.Label;
            attempt.Status = "approved";
            attempt.ReviewedByFacultyId = faculty.Id;
            attempt.ReviewedAt = DateTime.UtcNow;
        }
        else
        {
            attempt.Status = "graded"; // graded but not approved to unlock yet
        }

        await _context.SaveChangesAsync();
        return Ok(new
        {
            success = true,
            data = new
            {
                attempt.Status,
                attempt.TotalPossible,
                attempt.TotalAwarded,
                attempt.Percent,
                attempt.Passed,
                attempt.Grade
            }
        });

    }

    [HttpPost("attempts/{attemptId}/override-unlock")]
    public async Task<IActionResult> OverrideUnlock(int attemptId, [FromBody] OverrideUnlockRequest request)
    {
        var attempt = await _context.AssessmentAttempts.FindAsync(attemptId);
        if (attempt == null) return NotFound(new { success = false, errors = new[] { "Not found." } });

        attempt.FacultyOverrideUnlock = request.Override;
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpGet("students/{studentId}/full-report")]
    [HttpGet("students/{studentId}/course-overview")]
    public async Task<IActionResult> GetStudentCourseOverview(int studentId, [FromQuery] int batchCourseId)
    {
        var faculty = await CurrentFaculty();
        if (faculty == null) return Unauthorized(new { success = false, errors = new[] { "Not faculty." } });

        var bc = await _context.BatchCourses.Include(x => x.Course).FirstOrDefaultAsync(x => x.Id == batchCourseId);
        if (bc?.Course == null) return NotFound(new { success = false, errors = new[] { "Course not found." } });

        var student = await _context.Students.FindAsync(studentId);
        if (student == null) return NotFound(new { success = false, errors = new[] { "Student not found." } });

        var modules = await _context.Modules.Where(m => m.CourseId == bc.CourseId && !m.IsDraft)
            .OrderBy(m => m.SortOrder).ToListAsync();

        var completedModuleIds = await _context.StudentModuleProgress
            .Where(p => p.StudentId == studentId).Select(p => p.ModuleId).ToListAsync();
        var completedChapterIds = await _context.StudentChapterProgress
            .Where(p => p.StudentId == studentId).Select(p => p.ChapterId).ToListAsync();

        var moduleList = new List<ModuleListItemForStudentDto>();
        foreach (var m in modules)
        {
            var chapterCount = await _context.Chapters.CountAsync(c => c.ModuleId == m.Id && !c.IsDraft);
            var chaptersCompletedCount = await _context.Chapters
                .Where(c => c.ModuleId == m.Id && !c.IsDraft && completedChapterIds.Contains(c.Id)).CountAsync();

            string? gateStatus = null;
            if (m.IsFinalAssessment)
            {
                var assessment = await _context.Assessments.FirstOrDefaultAsync(a => a.ModuleId == m.Id);
                gateStatus = await ResolveGateStatus(assessment, studentId, m.IsPass, m.IsReviewUnlock);
            }

            moduleList.Add(new ModuleListItemForStudentDto
            {
                Id = m.Id,
                Name = m.Name,
                Completed = completedModuleIds.Contains(m.Id),
                HasGate = m.IsFinalAssessment,
                GateStatus = gateStatus,
                ChapterCount = chapterCount,
                ChaptersCompleted = chaptersCompletedCount
            });
        }

        return Ok(new
        {
            success = true,
            data = new StudentCourseOverviewDto
            {
                StudentId = student.Id,
                Name = student.Name,
                PhotoUrl = string.IsNullOrEmpty(student.PhotoPath) ? null : $"/storage/{student.PhotoPath}",
                CourseName = bc.Course.Name,
                TotalModules = modules.Count,
                ModulesCompleted = moduleList.Count(x => x.Completed),
                Modules = moduleList
            }
        });
    }

    [HttpGet("students/{studentId}/modules/{moduleId}")]
    public async Task<IActionResult> GetModuleDetailForStudent(int studentId, int moduleId)
    {
        var faculty = await CurrentFaculty();
        if (faculty == null) return Unauthorized(new { success = false, errors = new[] { "Not faculty." } });

        var module = await _context.Modules.FindAsync(moduleId);
        if (module == null) return NotFound(new { success = false, errors = new[] { "Module not found." } });

        var completedModuleIds = await _context.StudentModuleProgress
            .Where(p => p.StudentId == studentId).Select(p => p.ModuleId).ToListAsync();
        var chapterProgress = await _context.StudentChapterProgress
            .Where(p => p.StudentId == studentId).ToListAsync();

        var result = new ModuleDetailForStudentDto
        {
            ModuleId = module.Id,
            ModuleName = module.Name,
            Completed = completedModuleIds.Contains(module.Id)
        };

        if (module.IsFinalAssessment)
        {
            var assessment = await _context.Assessments.FirstOrDefaultAsync(a => a.ModuleId == module.Id);
            if (assessment != null)
                result.ModuleAssessment = await BuildAttemptSummary(assessment, studentId);
        }

        var chapters = await _context.Chapters.Where(c => c.ModuleId == moduleId && !c.IsDraft)
            .OrderBy(c => c.SortOrder).ToListAsync();

        foreach (var c in chapters)
        {
            var progress = chapterProgress.FirstOrDefault(p => p.ChapterId == c.Id);
            string? gateStatus = null;
            int? assessmentId = null;
            if (c.IsFinalAssessment)
            {
                var assessment = await _context.Assessments.FirstOrDefaultAsync(a => a.ChapterId == c.Id);
                assessmentId = assessment?.Id;
                gateStatus = await ResolveGateStatus(assessment, studentId, c.IsPass, c.IsReviewUnlock);
            }

            result.Chapters.Add(new ChapterListItemForStudentDto
            {
                Id = c.Id,
                Name = c.Name,
                Completed = progress != null,
                CompletedAt = progress?.CompletedAt,
                HasGate = c.IsFinalAssessment,
                GateStatus = gateStatus,
                AssessmentId = assessmentId
            });
        }

        return Ok(new { success = true, data = result });
    }

    [HttpGet("students/{studentId}/assessments/{assessmentId}/attempts")]
    public async Task<IActionResult> GetAssessmentAttemptsForStudent(int studentId, int assessmentId)
    {
        var faculty = await CurrentFaculty();
        if (faculty == null) return Unauthorized(new { success = false, errors = new[] { "Not faculty." } });

        var assessment = await _context.Assessments.FindAsync(assessmentId);
        if (assessment == null) return NotFound(new { success = false, errors = new[] { "Assessment not found." } });

        var summary = await BuildAttemptSummary(assessment, studentId);
        return Ok(new { success = true, data = summary });
    }

  private async Task<string?> ResolveGateStatus(Assessment? assessment, int studentId, bool isPass, bool isReviewUnlock)
{
    if (assessment == null) return "no_assessment";
    if (!assessment.IsPublished || !assessment.IsActive) return "not_published";

        var latest = await _context.AssessmentAttempts
            .Where(a => a.AssessmentId == assessment.Id && a.StudentId == studentId && a.Status != "in_progress")
            .OrderByDescending(a => a.SubmittedAt).FirstOrDefaultAsync();

        if (latest == null) return "not_attempted";
        if (latest.Status == "grading") return "pending_review";

        if (assessment.Mode == "instant")
        {
            if (isPass && latest.Passed != true && !latest.FacultyOverrideUnlock) return "failed_blocked";
            if (isReviewUnlock && latest.Status != "approved") return "graded_not_approved";
            return "passed";
        }

        if (!isReviewUnlock) return "approved";
        return latest.Status == "approved" ? "approved" : "graded_not_approved";
    }
    private async Task<AttemptSummaryDto> BuildAttemptSummary(Assessment assessment, int studentId)
    {
        var attempts = await _context.AssessmentAttempts
            .Where(a => a.AssessmentId == assessment.Id && a.StudentId == studentId && a.Status != "in_progress")
            .OrderByDescending(a => a.SubmittedAt)
            .ToListAsync();

        return new AttemptSummaryDto
        {
            AssessmentId = assessment.Id,
            AssessmentName = assessment.Name,
            Mode = assessment.Mode,
            Attempts = attempts.Select(a => new AttemptHistoryItemDto
            {
                AttemptId = a.Id,
                Status = a.Status,
                TotalPossible = a.TotalPossible,
                TotalAwarded = a.TotalAwarded,
                Percent = a.Percent,
                Passed = a.Passed,
                Grade = a.Grade,
                FacultyOverrideUnlock = a.FacultyOverrideUnlock,
                StartedAt = a.StartedAt,
                SubmittedAt = a.SubmittedAt,
                ReviewedAt = a.ReviewedAt
            }).ToList()
        };
    }
}