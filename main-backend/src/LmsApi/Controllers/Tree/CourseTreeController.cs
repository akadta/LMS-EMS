using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Data;
using dotnet.LmsApi.Dtos;

namespace dotnet.LmsApi.Controllers;

[Authorize]
[Route("api/lms/course-tree")]
public class CourseTreeController : BaseController
{
    private readonly AppDbContext _context;
    public CourseTreeController(AppDbContext context) { _context = context; }

    [HttpGet("{courseId}")]
    public async Task<IActionResult> GetTree(int courseId)
    {
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) return NotFound(new { success = false, errors = new[] { "Course not found." } });

        var tree = new CourseTreeDto
        {
            CourseId = course.Id,
            CourseName = course.Name,
            IsDraft = course.IsDraft,
            HasFinalAssessment = course.IsFinalAssessment
        };

        if (course.IsFinalAssessment)
        {
            var a = await _context.Assessments.Include(x => x.Questions).FirstOrDefaultAsync(x => x.CourseId == courseId);
            if (a != null)
            {
                tree.AssessmentId = a.Id;
                tree.AssessmentIsDraft = a.IsDraft;
                tree.AssessmentIsPublished = a.IsPublished;
                tree.AssessmentQuestionCount = a.Questions.Count;
            }
        }

        var modules = await _context.Modules.Where(m => m.CourseId == courseId).OrderBy(m => m.SortOrder).ToListAsync();
        foreach (var m in modules)
        {
            var moduleDto = new ModuleTreeDto
            {
                Id = m.Id,
                Name = m.Name,
                IsDraft = m.IsDraft,
                HasFinalAssessment = m.IsFinalAssessment
            };

            if (m.IsFinalAssessment)
            {
                var a = await _context.Assessments.Include(x => x.Questions).FirstOrDefaultAsync(x => x.ModuleId == m.Id);
                if (a != null)
                {
                    moduleDto.AssessmentId = a.Id;
                    moduleDto.AssessmentIsDraft = a.IsDraft;
                    moduleDto.AssessmentIsPublished = a.IsPublished;
                    moduleDto.AssessmentQuestionCount = a.Questions.Count;
                }
            }

            var chapters = await _context.Chapters.Where(c => c.ModuleId == m.Id).OrderBy(c => c.SortOrder).ToListAsync();
            foreach (var c in chapters)
            {
                var chapterDto = new ChapterTreeDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    IsDraft = c.IsDraft,
                    HasFinalAssessment = c.IsFinalAssessment
                };

                if (c.IsFinalAssessment)
                {
                    var a = await _context.Assessments.Include(x => x.Questions).FirstOrDefaultAsync(x => x.ChapterId == c.Id);
                    if (a != null)
                    {
                        chapterDto.AssessmentId = a.Id;
                        chapterDto.AssessmentIsDraft = a.IsDraft;
                        chapterDto.AssessmentIsPublished = a.IsPublished;
                        chapterDto.AssessmentQuestionCount = a.Questions.Count;
                    }
                }

                moduleDto.Chapters.Add(chapterDto);
            }

            tree.Modules.Add(moduleDto);
        }

        return Ok(new { success = true, data = tree });
    }

    [HttpPost("{courseId}/publish-all")]
    public async Task<IActionResult> PublishAll(int courseId)
    {
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) return NotFound(new { success = false, errors = new[] { "Course not found." } });

        var result = new PublishAllResultDto();

        course.IsDraft = false;

        var modules = await _context.Modules.Where(m => m.CourseId == courseId).ToListAsync();
        foreach (var m in modules)
        {
            if (m.IsDraft) { m.IsDraft = false; result.ModulesPublished++; }
        }

        var moduleIds = modules.Select(m => m.Id).ToList();
        var chapters = await _context.Chapters.Where(c => moduleIds.Contains(c.ModuleId)).ToListAsync();
        foreach (var c in chapters)
        {
            if (c.IsDraft) { c.IsDraft = false; result.ChaptersPublished++; }
        }

        var chapterIds = chapters.Select(c => c.Id).ToList();
        var assessments = await _context.Assessments
            .Where(a => a.CourseId == courseId || (a.ModuleId != null && moduleIds.Contains(a.ModuleId.Value)) || (a.ChapterId != null && chapterIds.Contains(a.ChapterId.Value)))
            .ToListAsync();
      foreach (var a in assessments)
{
    var questionCount = await _context.AssessmentQuestions.CountAsync(q => q.AssessmentId == a.Id);
    if (questionCount == 0) continue; // don't publish empty assessments — leave as draft for manual review

    if (a.IsDraft || !a.IsPublished)
    {
        a.IsDraft = false;
        a.IsPublished = true;
        if (a.PassPercentage == null) a.PassPercentage = 50; // sane default so gating works
        result.AssessmentsPublished++;
    }
}

        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = result });
    }
}