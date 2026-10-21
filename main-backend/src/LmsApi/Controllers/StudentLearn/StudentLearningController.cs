using System.Text.Json;
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
[Route("api/student/learning")]
public class StudentLearningController : BaseController
{
    private readonly AppDbContext _context;
    public StudentLearningController(AppDbContext context) { _context = context; }

    private async Task<Student?> CurrentStudent() =>
        await _context.Students.FirstOrDefaultAsync(s => s.UserId == CurrentUserId);

    [HttpGet("batches")]
    public async Task<IActionResult> GetBatches()
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        var batchIds = await _context.BatchStudents.Where(bs => bs.StudentId == student.Id).Select(bs => bs.BatchId).ToListAsync();
        var batches = await _context.Batches.Where(b => batchIds.Contains(b.Id) && b.IsActive).ToListAsync();

        var data = new List<StudentBatchDto>();
        foreach (var b in batches)
        {
            var courseCount = await _context.BatchCourses.CountAsync(bc => bc.BatchId == b.Id);
            data.Add(new StudentBatchDto { BatchId = b.Id, BatchName = b.Name, CourseCount = courseCount });
        }
        return Ok(new { success = true, data });
    }

    [HttpGet("batches/{batchId}/courses")]
    public async Task<IActionResult> GetBatchCourses(int batchId)
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        var allocatedCourseIds = await _context.BatchCourseStudents
            .Where(bcs => bcs.StudentId == student.Id)
            .Join(_context.BatchCourses.Where(bc => bc.BatchId == batchId), bcs => bcs.BatchCourseId, bc => bc.Id, (bcs, bc) => bc)
            .ToListAsync();

        var data = new List<StudentBatchCourseDto>();
        foreach (var bc in allocatedCourseIds)
        {
            var course = await _context.Courses.Include(c => c.Images).FirstOrDefaultAsync(c => c.Id == bc.CourseId);
            if (course == null || course.IsDraft) continue;

            var enrollment = await _context.StudentCourseEnrollments
                .FirstOrDefaultAsync(e => e.StudentId == student.Id && e.BatchCourseId == bc.Id);

            data.Add(new StudentBatchCourseDto
            {
                BatchCourseId = bc.Id,
                CourseId = course.Id,
                CourseName = course.Name,
                CoverImageUrl = course.Images.OrderBy(i => i.SortOrder).Select(i => $"/storage/{i.ImagePath}").FirstOrDefault(),
                Enrolled = enrollment != null,
                Expired = enrollment?.ExpiresAt != null && enrollment.ExpiresAt < DateTime.UtcNow,
                Completed = enrollment?.CompletedAt != null,
                ExpiresAt = enrollment?.ExpiresAt
            });
        }
        return Ok(new { success = true, data });
    }

    [HttpPost("batch-courses/{batchCourseId}/enroll")]
    public async Task<IActionResult> Enroll(int batchCourseId)
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        var isAllocated = await _context.BatchCourseStudents.AnyAsync(a => a.BatchCourseId == batchCourseId && a.StudentId == student.Id);
        if (!isAllocated) return Unauthorized(new { success = false, errors = new[] { "You are not allocated to this course." } });

        var existing = await _context.StudentCourseEnrollments
            .FirstOrDefaultAsync(e => e.StudentId == student.Id && e.BatchCourseId == batchCourseId);
        if (existing != null)
            return Ok(new { success = true, data = new EnrollResponseDto { EnrollmentId = existing.Id, StartedAt = existing.StartedAt, ExpiresAt = existing.ExpiresAt } });

        var bc = await _context.BatchCourses.Include(x => x.Course).FirstOrDefaultAsync(x => x.Id == batchCourseId);
        if (bc?.Course == null) return NotFound(new { success = false, errors = new[] { "Course not found." } });

        var days = DurationHelper.ToDays(bc.Course.DurationValue, bc.Course.DurationUnit);
        var enrollment = new StudentCourseEnrollment
        {
            StudentId = student.Id,
            BatchCourseId = batchCourseId,
            StartedAt = DateTime.UtcNow,
            ExpiresAt = days > 0 ? DateTime.UtcNow.AddDays(days) : null
        };
        _context.StudentCourseEnrollments.Add(enrollment);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new EnrollResponseDto { EnrollmentId = enrollment.Id, StartedAt = enrollment.StartedAt, ExpiresAt = enrollment.ExpiresAt } });
    }

    [HttpGet("courses/{courseId}/modules")]
    public async Task<IActionResult> GetModules(int courseId)
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        var hasValidEnrollment = await _context.StudentCourseEnrollments
            .Include(e => e.BatchCourse)
            .AnyAsync(e => e.StudentId == student.Id
                && e.BatchCourse != null && e.BatchCourse.CourseId == courseId
                && (e.ExpiresAt == null || e.ExpiresAt >= DateTime.UtcNow));

        if (!hasValidEnrollment)
            return BadRequest(new { success = false, errors = new[] { "Your access to this course has expired or is not active." } });

        var modules = await _context.Modules.Where(m => m.CourseId == courseId && !m.IsDraft)
                .OrderBy(m => m.SortOrder).ToListAsync();

        var completedIds = await _context.StudentModuleProgress.Where(p => p.StudentId == student.Id).Select(p => p.ModuleId).ToListAsync();

        var data = new List<StudentModuleStatusDto>();
        bool prevDone = true;
        foreach (var m in modules)
        {
            var chapterCount = await _context.Chapters.CountAsync(c => c.ModuleId == m.Id && !c.IsDraft);
            if (chapterCount == 0) continue; // skip empty modules

            var completed = completedIds.Contains(m.Id);
            var unlocked = prevDone && !m.IsLock;

            int? assessmentId = null;
            bool gateCleared = true; string? blockReason = null;
            if (m.IsFinalAssessment)
            {
                var a = await _context.Assessments.FirstOrDefaultAsync(x => x.ModuleId == m.Id && x.IsPublished && x.IsActive);
                assessmentId = a?.Id;
                (gateCleared, blockReason) = await GatingHelper.IsGateClearedAsync(_context, student.Id, m.IsFinalAssessment, m.IsPass, m.IsReviewUnlock, assessmentId);
            }

            data.Add(new StudentModuleStatusDto
            {
                Id = m.Id,
                Name = m.Name,
                ImageUrl = string.IsNullOrEmpty(m.ImagePath) ? null : $"/storage/{m.ImagePath}",
                ChapterCount = chapterCount,
                Completed = completed,
                Unlocked = unlocked,
                HasGate = m.IsFinalAssessment,
                GateCleared = gateCleared,
                GateBlockReason = blockReason,
                AssessmentId = assessmentId
            });

            prevDone = completed && gateCleared;
        }
        return Ok(new { success = true, data });
    }

    [HttpGet("modules/{moduleId}/chapters")]
    public async Task<IActionResult> GetChapters(int moduleId)
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        var module = await _context.Modules.FindAsync(moduleId);
        if (module == null) return NotFound(new { success = false, errors = new[] { "Module not found." } });

        var hasValidEnrollment = await _context.StudentCourseEnrollments
            .Include(e => e.BatchCourse)
            .AnyAsync(e => e.StudentId == student.Id
                && e.BatchCourse != null && e.BatchCourse.CourseId == module.CourseId
                && (e.ExpiresAt == null || e.ExpiresAt >= DateTime.UtcNow));

        if (!hasValidEnrollment)
            return BadRequest(new { success = false, errors = new[] { "Your access to this course has expired or is not active." } });

        var chapters = await _context.Chapters.Where(c => c.ModuleId == moduleId && !c.IsDraft)
                .OrderBy(c => c.SortOrder).ToListAsync();

        var completedIds = await _context.StudentChapterProgress.Where(p => p.StudentId == student.Id).Select(p => p.ChapterId).ToListAsync();

        var data = new List<StudentChapterStatusDto>();
        bool prevDone = true;
        foreach (var c in chapters)
        {
            var completed = completedIds.Contains(c.Id);
            var unlocked = prevDone;

            int? assessmentId = null;
            bool gateCleared = true; string? blockReason = null;
            if (c.IsFinalAssessment)
            {
                var a = await _context.Assessments.FirstOrDefaultAsync(x => x.ChapterId == c.Id && x.IsPublished && x.IsActive);
                assessmentId = a?.Id;
                (gateCleared, blockReason) = await GatingHelper.IsGateClearedAsync(_context, student.Id, c.IsFinalAssessment, c.IsPass, c.IsReviewUnlock, assessmentId);
            }

            data.Add(new StudentChapterStatusDto
            {
                Id = c.Id,
                Name = c.Name,
                Completed = completed,
                Unlocked = unlocked,
                HasGate = c.IsFinalAssessment,
                GateCleared = gateCleared,
                GateBlockReason = blockReason,
                AssessmentId = assessmentId
            });

            prevDone = completed && gateCleared;
        }
        return Ok(new { success = true, data });
    }

    [HttpPost("chapters/{chapterId}/complete")]
    public async Task<IActionResult> CompleteChapter(int chapterId)
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        var exists = await _context.StudentChapterProgress.AnyAsync(p => p.StudentId == student.Id && p.ChapterId == chapterId);
        if (!exists)
        {
            _context.StudentChapterProgress.Add(new StudentChapterProgress { StudentId = student.Id, ChapterId = chapterId });
            await _context.SaveChangesAsync();
        }
        return Ok(new { success = true });
    }

    [HttpPost("modules/{moduleId}/complete")]
    public async Task<IActionResult> CompleteModule(int moduleId)
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        var exists = await _context.StudentModuleProgress.AnyAsync(p => p.StudentId == student.Id && p.ModuleId == moduleId);
        if (!exists)
        {
            _context.StudentModuleProgress.Add(new StudentModuleProgress { StudentId = student.Id, ModuleId = moduleId });
            await _context.SaveChangesAsync();
        }
        return Ok(new { success = true });
    }
    [HttpPost("attempts/submit")]
    public async Task<IActionResult> SubmitAttempt([FromBody] SubmitAttemptRequest request)
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        var attempt = await _context.AssessmentAttempts.FirstOrDefaultAsync(a => a.Id == request.AttemptId && a.StudentId == student.Id);
        if (attempt == null) return NotFound(new { success = false, errors = new[] { "Attempt not found." } });

        if (attempt.Status != "in_progress")
        {
            return Ok(new
            {
                success = true,
                data = new AttemptResultDto
                {
                    AttemptId = attempt.Id,
                    Mode = attempt.Mode,
                    Status = attempt.Status,
                    TotalPossible = attempt.TotalPossible,
                    TotalAwarded = attempt.TotalAwarded,
                    Percent = attempt.Percent,
                    Passed = attempt.Passed,
                    Grade = attempt.Grade
                }
            });
        }

        var assessment = await _context.Assessments.Include(a => a.Questions).ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(a => a.Id == request.AssessmentId);
        if (assessment == null) return NotFound(new { success = false, errors = new[] { "Assessment not found." } });
        attempt.Status = assessment.Mode == "instant" ? "graded" : "grading";
        attempt.SubmittedAt = DateTime.UtcNow;

        // remove any autosaved answer rows before writing the final submitted set,
        // otherwise submit stacks duplicates on top of what autosave already wrote
        var existingAttemptAnswers = _context.AssessmentAttemptAnswers.Where(a => a.AttemptId == attempt.Id);
        _context.AssessmentAttemptAnswers.RemoveRange(existingAttemptAnswers);
        await _context.SaveChangesAsync();

        double totalPossible = 0, totalAwarded = 0;
        foreach (var ans in request.Answers)
        {
            var question = assessment.Questions.FirstOrDefault(q => q.Id == ans.QuestionId);
            if (question == null) continue;

            double? mark = null;
            var isOptionType = question.QuestionType is "mcq_single" or "mcq_multi";

            if (isOptionType && assessment.Mode == "instant")
            {
                var correctIds = question.Options.Where(o => o.IsCorrect).Select(o => o.Id).ToList();
                var selected = ans.SelectedOptionIds ?? new List<int>();

                if (question.MarkingMode == "per_option")
                {
                    var possible = question.Options.Where(o => o.IsCorrect).Sum(o => o.Mark ?? 0);
                    var incorrectSelectedCount = question.Options.Count(o => !o.IsCorrect && selected.Contains(o.Id));

                    double awarded;
                    if (incorrectSelectedCount > 0)
                    {
                        // selecting any wrong option forfeits marks for this question entirely
                        awarded = 0;
                    }
                    else
                    {
                        awarded = question.Options.Where(o => o.IsCorrect && selected.Contains(o.Id)).Sum(o => o.Mark ?? 0);
                    }

                    mark = awarded; totalPossible += possible; totalAwarded += awarded;
                }
                else
                {
                    var possible = question.Mark ?? 0;
                    var fullyCorrect = correctIds.Count == selected.Count && correctIds.All(id => selected.Contains(id));
                    mark = fullyCorrect ? possible : 0;
                    totalPossible += possible; totalAwarded += mark.Value;
                }
            }
            else if (assessment.Mode == "instant" && question.Mark != null)
            {
                totalPossible += question.Mark.Value; // shouldn't normally hit (short/long requires review mode)
            }

            _context.AssessmentAttemptAnswers.Add(new AssessmentAttemptAnswer
            {
                AttemptId = attempt.Id,
                QuestionId = question.Id,
                SelectedOptionIdsJson = ans.SelectedOptionIds != null ? JsonSerializer.Serialize(ans.SelectedOptionIds) : null,
                TextAnswer = ans.TextAnswer,
                MarkAwarded = mark
            });
        }

        if (assessment.Mode == "instant")
        {
            var percent = totalPossible > 0 ? Math.Round((totalAwarded / totalPossible) * 100, 2) : 0;
            attempt.TotalPossible = totalPossible;
            attempt.TotalAwarded = totalAwarded;
            attempt.Percent = percent;
            attempt.Passed = assessment.PassPercentage != null ? percent >= assessment.PassPercentage : (bool?)null;
            attempt.Grade = assessment.Grades.OrderBy(g => g.SortOrder)
                .FirstOrDefault(g => percent >= g.MinPercentage && percent <= g.MaxPercentage)?.Label;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            data = new AttemptResultDto
            {
                AttemptId = attempt.Id,
                Mode = attempt.Mode,
                Status = attempt.Status,
                TotalPossible = attempt.TotalPossible,
                TotalAwarded = attempt.TotalAwarded,
                Percent = attempt.Percent,
                Passed = attempt.Passed,
                Grade = attempt.Grade
            }
        });
    }

    [HttpGet("assessments/{id}")]
    public async Task<IActionResult> GetAssessment(int id)
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        var a = await _context.Assessments.Include(x => x.Grades)
            .FirstOrDefaultAsync(x => x.Id == id && x.IsPublished && x.IsActive);
        if (a == null) return NotFound(new { success = false, errors = new[] { "Assessment not found." } });

        return Ok(new
        {
            success = true,
            data = new
            {
                a.Id,
                a.Name,
                a.Description,
                a.Mode,
                a.IsTimer,
                a.TimerScope,
                a.TimerValue,
                a.TimerUnit,
                a.QuestionFormat,
                a.OptionFormat,
                a.IsShuffle,
                a.PassPercentage,
                a.QuestionsToShow,
                Grades = a.Grades.OrderBy(g => g.SortOrder).Select(g => new { g.Id, g.Label, g.MinPercentage, g.MaxPercentage })
            }
        });
    }

    [HttpGet("assessments/{id}/questions")]
    public async Task<IActionResult> GetAssessmentQuestions(int id)
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        var assessmentOk = await _context.Assessments.AnyAsync(x => x.Id == id && x.IsPublished && x.IsActive);
        if (!assessmentOk) return NotFound(new { success = false, errors = new[] { "Assessment not found." } });

        var questions = await _context.AssessmentQuestions.Include(q => q.Options).Include(q => q.Media)
            .Where(q => q.AssessmentId == id)
            .OrderBy(q => q.SortOrder).ThenBy(q => q.Id)
            .ToListAsync();

        var data = questions.Select(q => new
        {
            q.Id,
            q.QuestionText,
            q.QuestionType,
            q.MarkingMode,
            q.Mark,
            Options = q.Options.OrderBy(o => o.SortOrder).Select(o => new { o.Id, o.OptionText, o.IsCorrect, o.Mark }),
            Media = q.Media.OrderBy(m => m.SortOrder).Select(m => new { m.Id, m.MediaType, Url = $"/storage/{m.FilePath}" })
        });

        return Ok(new { success = true, data });
    }


    [HttpPost("assessments/{id}/start")]
    public async Task<IActionResult> StartAttempt(int id)
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        var assessment = await _context.Assessments.FindAsync(id);
        if (assessment == null || !assessment.IsPublished || !assessment.IsActive)
            return NotFound(new { success = false, errors = new[] { "Assessment not found." } });

        var existing = await _context.AssessmentAttempts
            .FirstOrDefaultAsync(a => a.AssessmentId == id && a.StudentId == student.Id && a.Status == "in_progress");

        if (existing != null && (existing.ExpiresAt == null || existing.ExpiresAt >= DateTime.UtcNow))
        {
            return Ok(new { success = true, data = new { attemptId = existing.Id, startedAt = existing.StartedAt, expiresAt = existing.ExpiresAt, serverNow = DateTime.UtcNow } });
        }

        DateTime? expiresAt = null;
        if (assessment.IsTimer && assessment.TimerScope == "per_exam")
        {
            var seconds = (assessment.TimerValue ?? 0) * (assessment.TimerUnit == "minutes" ? 60 : 1);
            expiresAt = DateTime.UtcNow.AddSeconds(seconds);
        }

        var attempt = new AssessmentAttempt
        {
            AssessmentId = id,
            StudentId = student.Id,
            Mode = assessment.Mode,
            Status = "in_progress",
            StartedAt = DateTime.UtcNow,
            ExpiresAt = expiresAt
        };
        _context.AssessmentAttempts.Add(attempt);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { attemptId = attempt.Id, startedAt = attempt.StartedAt, expiresAt = attempt.ExpiresAt, serverNow = DateTime.UtcNow } });
    }

    [HttpPut("attempts/{attemptId}/answers")]
    public async Task<IActionResult> SaveProgress(int attemptId, [FromBody] SubmitAttemptRequest request)
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        var attempt = await _context.AssessmentAttempts.FirstOrDefaultAsync(a => a.Id == attemptId && a.StudentId == student.Id && a.Status == "in_progress");
        if (attempt == null) return NotFound(new { success = false, errors = new[] { "Attempt not found or already submitted." } });

        if (attempt.ExpiresAt != null && attempt.ExpiresAt < DateTime.UtcNow)
            return BadRequest(new { success = false, errors = new[] { "Time expired." } });

        var existingAnswers = _context.AssessmentAttemptAnswers.Where(a => a.AttemptId == attemptId);
        _context.AssessmentAttemptAnswers.RemoveRange(existingAnswers);

        foreach (var ans in request.Answers)
        {
            _context.AssessmentAttemptAnswers.Add(new AssessmentAttemptAnswer
            {
                AttemptId = attemptId,
                QuestionId = ans.QuestionId,
                SelectedOptionIdsJson = ans.SelectedOptionIds != null ? JsonSerializer.Serialize(ans.SelectedOptionIds) : null,
                TextAnswer = ans.TextAnswer
            });
        }
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpGet("attempts/{attemptId}/answers")]
    public async Task<IActionResult> GetProgress(int attemptId)
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        var attempt = await _context.AssessmentAttempts.FirstOrDefaultAsync(a => a.Id == attemptId && a.StudentId == student.Id);
        if (attempt == null) return NotFound(new { success = false, errors = new[] { "Attempt not found." } });

        var answers = await _context.AssessmentAttemptAnswers.Where(a => a.AttemptId == attemptId).ToListAsync();
        return Ok(new
        {
            success = true,
            data = answers.Select(a => new
            {
                a.QuestionId,
                SelectedOptionIds = a.SelectedOptionIdsJson != null ? JsonSerializer.Deserialize<List<int>>(a.SelectedOptionIdsJson) : null,
                a.TextAnswer
            })
        });
    }

    [HttpGet("gate-status/{entityType}/{entityId}")]
    public async Task<IActionResult> GetGateStatus(string entityType, int entityId)
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        bool isFinalAssessment = false, isPass = false, isReviewUnlock = false;
        int? assessmentId = null;

        if (entityType == "module")
        {
            var m = await _context.Modules.FindAsync(entityId);
            if (m == null) return NotFound(new { success = false, errors = new[] { "Module not found." } });
            isFinalAssessment = m.IsFinalAssessment; isPass = m.IsPass; isReviewUnlock = m.IsReviewUnlock;
            var a = await _context.Assessments.FirstOrDefaultAsync(x => x.ModuleId == entityId && x.IsPublished && x.IsActive);
            assessmentId = a?.Id;
        }
        else if (entityType == "chapter")
        {
            var c = await _context.Chapters.FindAsync(entityId);
            if (c == null) return NotFound(new { success = false, errors = new[] { "Chapter not found." } });
            isFinalAssessment = c.IsFinalAssessment; isPass = c.IsPass; isReviewUnlock = c.IsReviewUnlock;
            var a = await _context.Assessments.FirstOrDefaultAsync(x => x.ChapterId == entityId && x.IsPublished && x.IsActive);
            assessmentId = a?.Id;
        }
        else
        {
            return BadRequest(new { success = false, errors = new[] { "Invalid entity type." } });
        }

        var (gateCleared, reason) = await Shared.Services.GatingHelper.IsGateClearedAsync(
            _context, student.Id, isFinalAssessment, isPass, isReviewUnlock, assessmentId);

        return Ok(new { success = true, data = new { gateCleared, reason, isPass, isReviewUnlock } });
    }

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        var batchIds = await _context.BatchStudents.Where(bs => bs.StudentId == student.Id).Select(bs => bs.BatchId).ToListAsync();
        var batches = await _context.Batches.Where(b => batchIds.Contains(b.Id)).ToListAsync();

        var result = new List<StudentHistoryBatchDto>();
        foreach (var b in batches)
        {
            var batchDto = new StudentHistoryBatchDto { BatchId = b.Id, BatchName = b.Name };

            var allocatedBatchCourses = await _context.BatchCourseStudents
                .Where(bcs => bcs.StudentId == student.Id)
                .Join(_context.BatchCourses.Where(bc => bc.BatchId == b.Id), bcs => bcs.BatchCourseId, bc => bc.Id, (bcs, bc) => bc)
                .ToListAsync();

            foreach (var bc in allocatedBatchCourses)
            {
                var course = await _context.Courses.FindAsync(bc.CourseId);
                if (course == null) continue;

                var enrollment = await _context.StudentCourseEnrollments
                    .FirstOrDefaultAsync(e => e.StudentId == student.Id && e.BatchCourseId == bc.Id);

                var totalModules = await _context.Modules.CountAsync(m => m.CourseId == course.Id && !m.IsDraft);
                var completedModuleIds = await _context.StudentModuleProgress.Where(p => p.StudentId == student.Id).Select(p => p.ModuleId).ToListAsync();
                var moduleIdsForCourse = await _context.Modules.Where(m => m.CourseId == course.Id).Select(m => m.Id).ToListAsync();
                var modulesCompleted = moduleIdsForCourse.Count(id => completedModuleIds.Contains(id));

                batchDto.Courses.Add(new StudentHistoryCourseDto
                {
                    BatchCourseId = bc.Id,
                    CourseId = course.Id,
                    CourseName = course.Name,
                    Enrolled = enrollment != null,
                    StartedAt = enrollment?.StartedAt,
                    ExpiresAt = enrollment?.ExpiresAt,
                    Expired = enrollment?.ExpiresAt != null && enrollment.ExpiresAt < DateTime.UtcNow,
                    Completed = enrollment?.CompletedAt != null,
                    ModulesCompleted = modulesCompleted,
                    TotalModules = totalModules
                });
            }
            result.Add(batchDto);
        }

        return Ok(new { success = true, data = result });
    }

    [HttpGet("history/courses/{courseId}/modules")]
    public async Task<IActionResult> GetHistoryModules(int courseId)
    {
        var student = await CurrentStudent();
        if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

        var modules = await _context.Modules.Where(m => m.CourseId == courseId && !m.IsDraft).OrderBy(m => m.SortOrder).ToListAsync();
        var completedModuleIds = await _context.StudentModuleProgress.Where(p => p.StudentId == student.Id).Select(p => p.ModuleId).ToListAsync();
        var completedChapterIds = await _context.StudentChapterProgress.Where(p => p.StudentId == student.Id).Select(p => p.ChapterId).ToListAsync();
        var chapterProgress = await _context.StudentChapterProgress.Where(p => p.StudentId == student.Id).ToListAsync();

        var result = new List<StudentHistoryModuleDto>();
        foreach (var m in modules)
        {
            var moduleDto = new StudentHistoryModuleDto
            {
                Id = m.Id,
                Name = m.Name,
                Completed = completedModuleIds.Contains(m.Id),
                HasGate = m.IsFinalAssessment
            };

            if (m.IsFinalAssessment)
            {
                var a = await _context.Assessments.FirstOrDefaultAsync(x => x.ModuleId == m.Id && x.IsPublished && x.IsActive);
                if (a != null)
                {
                    moduleDto.Assessment = await BuildHistoryAssessmentSummary(a, student.Id);
                    var (_, reason) = await Shared.Services.GatingHelper.IsGateClearedAsync(_context, student.Id, m.IsFinalAssessment, m.IsPass, m.IsReviewUnlock, a.Id);
                    moduleDto.GateStatus = ResolveHistoryGateStatus(reason);
                }
            }

            var chapters = await _context.Chapters.Where(c => c.ModuleId == m.Id && !c.IsDraft).OrderBy(c => c.SortOrder).ToListAsync();
            foreach (var c in chapters)
            {
                var progress = chapterProgress.FirstOrDefault(p => p.ChapterId == c.Id);
                var chapterDto = new StudentHistoryChapterDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Completed = progress != null,
                    CompletedAt = progress?.CompletedAt,
                    HasGate = c.IsFinalAssessment
                };

                if (c.IsFinalAssessment)
                {
                    var a = await _context.Assessments.FirstOrDefaultAsync(x => x.ChapterId == c.Id && x.IsPublished && x.IsActive);
                    if (a != null)
                    {
                        chapterDto.Assessment = await BuildHistoryAssessmentSummary(a, student.Id);
                        var (_, reason) = await Shared.Services.GatingHelper.IsGateClearedAsync(_context, student.Id, c.IsFinalAssessment, c.IsPass, c.IsReviewUnlock, a.Id);
                        chapterDto.GateStatus = ResolveHistoryGateStatus(reason);
                    }
                }
                moduleDto.Chapters.Add(chapterDto);
            }
            result.Add(moduleDto);
        }

        return Ok(new { success = true, data = result });
    }

    private string ResolveHistoryGateStatus(string? reason) => reason switch
    {
        "not_attempted" => "not_attempted",
        "failed_pending_override" => "failed_blocked",
        "pending_review" => "pending_review",
        _ => "cleared"
    };

    private async Task<StudentHistoryAssessmentSummaryDto> BuildHistoryAssessmentSummary(Assessment assessment, int studentId)
    {
        var attempts = await _context.AssessmentAttempts
            .Where(a => a.AssessmentId == assessment.Id && a.StudentId == studentId && a.Status != "in_progress")
            .OrderByDescending(a => a.SubmittedAt)
            .ToListAsync();

        return new StudentHistoryAssessmentSummaryDto
        {
            AssessmentId = assessment.Id,
            AssessmentName = assessment.Name,
            Mode = assessment.Mode,
            Attempts = attempts.Select(a => new StudentHistoryAttemptDto
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

    [HttpGet("attempts/{attemptId}/detail")]
public async Task<IActionResult> GetAttemptDetailForStudent(int attemptId)
{
    var student = await CurrentStudent();
    if (student == null) return Unauthorized(new { success = false, errors = new[] { "Not a student." } });

    // Rule 2: only this student's own attempt, enforced server-side
    var attempt = await _context.AssessmentAttempts.Include(a => a.Answers)
        .FirstOrDefaultAsync(a => a.Id == attemptId && a.StudentId == student.Id);
    if (attempt == null) return NotFound(new { success = false, errors = new[] { "Attempt not found." } });

    // Rule 1: never expose an attempt that's still in progress
    if (attempt.Status == "in_progress")
        return BadRequest(new { success = false, errors = new[] { "This attempt is not yet submitted." } });

    var assessment = await _context.Assessments.FindAsync(attempt.AssessmentId);

    // Rule 3: don't reveal correctness/marks while a review-mode attempt is still being graded
    var revealAnswers = attempt.Status != "grading";

    // Rule 4: pull questions ONLY from what was actually recorded in this attempt's answers,
    // never from the live current question bank (which may have changed since)
    var questionIds = attempt.Answers.Select(a => a.QuestionId).ToList();
    var questions = await _context.AssessmentQuestions.Include(q => q.Options)
        .Where(q => questionIds.Contains(q.Id)).ToListAsync();

    var answerDtos = attempt.Answers.Select(ans =>
    {
        var q = questions.FirstOrDefault(x => x.Id == ans.QuestionId);
        return new StudentAttemptAnswerDetailDto
        {
            AnswerId = ans.Id,
            QuestionText = q?.QuestionText ?? "",
            QuestionType = q?.QuestionType ?? "",
            MaxMark = q?.MarkingMode == "per_option" ? q.Options.Where(o => o.IsCorrect).Sum(o => o.Mark ?? 0) : q?.Mark,
            MarkAwarded = revealAnswers ? ans.MarkAwarded : null,
            SelectedOptionIds = string.IsNullOrEmpty(ans.SelectedOptionIdsJson) ? null : System.Text.Json.JsonSerializer.Deserialize<List<int>>(ans.SelectedOptionIdsJson),
            TextAnswer = ans.TextAnswer,
            FacultyNote = revealAnswers ? ans.FacultyNote : null,
            Options = q?.Options.Select(o => new StudentAttemptOptionDto
            {
                Id = o.Id,
                OptionText = o.OptionText,
                // Rule 3: hide which options are correct until grading is finalized
                IsCorrect = revealAnswers && o.IsCorrect
            }).ToList() ?? new()
        };
    }).ToList();

    return Ok(new
    {
        success = true,
        data = new StudentAttemptDetailDto
        {
            AttemptId = attempt.Id,
            AssessmentName = assessment?.Name ?? "",
            Mode = attempt.Mode,
            Status = attempt.Status,
            Passed = revealAnswers ? attempt.Passed : null,
            Percent = revealAnswers ? attempt.Percent : null,
            TotalPossible = revealAnswers ? attempt.TotalPossible : null,
            TotalAwarded = revealAnswers ? attempt.TotalAwarded : null,
            Grade = revealAnswers ? attempt.Grade : null,
            RevealAnswers = revealAnswers,
            Answers = answerDtos
        }
    });
}
}