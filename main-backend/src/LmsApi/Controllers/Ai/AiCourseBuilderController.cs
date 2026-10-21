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
[Route("api/lms/ai-course-builder")]
public class AiCourseBuilderController : BaseController
{
    private readonly AppDbContext _context;
    private readonly IAiCourseStructureService _structureService;
    private readonly IImageSourceService _imageService;
    private readonly IFileStorageService _fileStorage;
    private readonly IAiQuestionService _aiQuestionService;
    private readonly ILogger<AiCourseBuilderController> _logger;

    public AiCourseBuilderController(AppDbContext context, IAiCourseStructureService structureService,
        IImageSourceService imageService, IFileStorageService fileStorage, IAiQuestionService aiQuestionService,
        ILogger<AiCourseBuilderController> logger)
    {
        _context = context;
        _structureService = structureService;
        _imageService = imageService;
        _fileStorage = fileStorage;
        _aiQuestionService = aiQuestionService;
        _logger = logger;
    }

    [HttpPost("create-complete-course")]
public async Task<IActionResult> CreateCompleteCourse([FromBody] AiCreateCompleteCourseRequest request)
{
    if (string.IsNullOrWhiteSpace(request.Options.Topic))
        return BadRequest(new { success = false, errors = new[] { "Topic is required." } });

    var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
    if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

    try
    {
        var structure = await _structureService.GenerateFullCourseAsync(request.Options);

        var course = new Course
        {
            OrganizationId = scope.OrganizationId,
            CompanyId = scope.CompanyId,
            DepartmentId = scope.DepartmentId,
            Name = structure.Name,
            Description = structure.Description,
            DifficultyLevel = structure.DifficultyLevel,
            IsFinalAssessment = structure.HasFinalAssessment,
            IsDraft = ResolveDraft(request.Options)
        };
        _context.Courses.Add(course);
        await _context.SaveChangesAsync();

            if (request.Options.IncludeImages)
            {
                try
                {
                    var imgPath = await _imageService.FindAndSaveImageAsync(structure.Name, "courses", _fileStorage);
                    if (imgPath != null)
                        _context.CourseImages.Add(new CourseImage { CourseId = course.Id, ImagePath = imgPath, SortOrder = 0 });
                    await _context.SaveChangesAsync();
                }
                catch { /* image failure shouldn't block course creation */ }
            }

            if (structure.HasFinalAssessment)
                await CreateAssessmentShell("course", course.Id, structure.Name, request.Options);

            int mOrder = 0;
            foreach (var m in structure.Modules)
            {
                var module = new CourseModule
                {
                    CourseId = course.Id,
                    Name = m.Name,
                    Description = m.Description,
                    DifficultyLevel = structure.DifficultyLevel,
                    IsFinalAssessment = m.HasFinalAssessment,
                    IsDraft = ResolveDraft(request.Options),
                    SortOrder = mOrder++
                };
                _context.Modules.Add(module);
                await _context.SaveChangesAsync();

                if (request.Options.IncludeImages)
                {
                    try
                    {
                        var imgPath = await _imageService.FindAndSaveImageAsync(m.Name, "modules", _fileStorage);
                        if (imgPath != null) module.ImagePath = imgPath;
                        await _context.SaveChangesAsync();
                    }
                    catch { /* image failure shouldn't block module creation */ }
                }

                if (m.HasFinalAssessment)
                    await CreateAssessmentShell("module", module.Id, m.Name, request.Options);

                int cOrder = 0;
                foreach (var c in m.Chapters)
                {
                    var chapter = new Chapter
                    {
                        ModuleId = module.Id,
                        Name = c.Name,
                        Description = c.Description,
                        IsFinalAssessment = c.HasFinalAssessment,
                        IsDraft = ResolveDraft(request.Options),
                        SortOrder = cOrder++
                    };
                    _context.Chapters.Add(chapter);
                    await _context.SaveChangesAsync();

                    if (request.Options.IncludeImages)
                        await AddChapterImage(chapter.Id, c.Name);

                    if (c.HasFinalAssessment)
                        await CreateAssessmentShell("chapter", chapter.Id, c.Name, request.Options);
                }
            }
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = new { courseId = course.Id } });
        }
     catch (Exception ex)
{
    _logger.LogError(ex, "CreateCompleteCourse failed");
    var fullError = ex.ToString(); // includes inner exception + stack trace
    return StatusCode(500, new { success = false, errors = new[] { $"Course generation failed: {ex.Message}" }, debug = fullError });
}
    }

    [HttpPost("add-modules")]
    public async Task<IActionResult> AddModules([FromBody] AiAddModulesRequest request)
    {
        var course = await _context.Courses.FindAsync(request.CourseId);
        if (course == null) return NotFound(new { success = false, errors = new[] { "Course not found." } });

        try
        {
            var modules = await _structureService.GenerateModulesAsync(course.Name, course.Description, request.Options);
            var sortOrder = await _context.Modules.Where(m => m.CourseId == request.CourseId).CountAsync();

            var createdIds = new List<int>();
            foreach (var m in modules)
            {
                var module = new CourseModule
                {
                    CourseId = request.CourseId,
                    Name = m.Name,
                    Description = m.Description,
                    DifficultyLevel = request.Options.Difficulty,
                    IsFinalAssessment = m.HasFinalAssessment,
                    IsDraft = ResolveDraft(request.Options),
                    SortOrder = sortOrder++
                };
                _context.Modules.Add(module);
                await _context.SaveChangesAsync();

                if (request.Options.IncludeImages)
                {
                    try
                    {
                        var imgPath = await _imageService.FindAndSaveImageAsync(m.Name, "modules", _fileStorage);
                        if (imgPath != null) module.ImagePath = imgPath;
                        await _context.SaveChangesAsync();
                    }
                    catch { /* image failure shouldn't block module creation */ }
                }

                if (m.HasFinalAssessment)
                    await CreateAssessmentShell("module", module.Id, m.Name, request.Options);

                int cOrder = 0;
                foreach (var c in m.Chapters)
                {
                    var chapter = new Chapter
                    {
                        ModuleId = module.Id,
                        Name = c.Name,
                        Description = c.Description,
                        IsFinalAssessment = c.HasFinalAssessment,
                        IsDraft = ResolveDraft(request.Options),
                        SortOrder = cOrder++
                    };
                    _context.Chapters.Add(chapter);
                    await _context.SaveChangesAsync();

                    if (request.Options.IncludeImages)
                        await AddChapterImage(chapter.Id, c.Name);

                    if (c.HasFinalAssessment)
                        await CreateAssessmentShell("chapter", chapter.Id, c.Name, request.Options);
                }
                createdIds.Add(module.Id);
            }
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = new { moduleIds = createdIds } });
        }
      catch (Exception ex)
{
    _logger.LogError(ex, "CreateCompleteCourse failed");
    var fullError = ex.ToString(); // includes inner exception + stack trace
    return StatusCode(500, new { success = false, errors = new[] { $"Course generation failed: {ex.Message}" }, debug = fullError });
}
    }

    [HttpPost("add-chapters")]
    public async Task<IActionResult> AddChapters([FromBody] AiAddChaptersRequest request)
    {
        var module = await _context.Modules.FindAsync(request.ModuleId);
        if (module == null) return NotFound(new { success = false, errors = new[] { "Module not found." } });

        try
        {
            var chapters = await _structureService.GenerateChaptersAsync(module.Name, module.Description, request.Options);
            var sortOrder = await _context.Chapters.Where(c => c.ModuleId == request.ModuleId).CountAsync();

            var createdIds = new List<int>();
            foreach (var c in chapters)
            {
                var chapter = new Chapter
                {
                    ModuleId = request.ModuleId,
                    Name = c.Name,
                    Description = c.Description,
                    IsFinalAssessment = c.HasFinalAssessment,
                    IsDraft = ResolveDraft(request.Options),
                    SortOrder = sortOrder++
                };
                _context.Chapters.Add(chapter);
                await _context.SaveChangesAsync();

                if (request.Options.IncludeImages)
                    await AddChapterImage(chapter.Id, c.Name);

                if (c.HasFinalAssessment)
                    await CreateAssessmentShell("chapter", chapter.Id, c.Name, request.Options);

                createdIds.Add(chapter.Id);
            }
            await _context.SaveChangesAsync();

            return Ok(new { success = true, data = new { chapterIds = createdIds } });
        }
      catch (Exception ex)
{
    _logger.LogError(ex, "CreateCompleteCourse failed");
    var fullError = ex.ToString(); // includes inner exception + stack trace
    return StatusCode(500, new { success = false, errors = new[] { $"Course generation failed: {ex.Message}" }, debug = fullError });
}
    }

    private bool ResolveDraft(AiStructureGenOptions options) =>
        options.DraftMode == "random" ? new Random().Next(2) == 1 : options.IsDraft;

    private async Task CreateAssessmentShell(string entityType, int entityId, string entityName, AiStructureGenOptions options)
    {
        var assessment = new Assessment
        {
            Name = $"{entityName} — Final Assessment",
            Mode = "instant",
            QuestionFormat = "numeric",
            OptionFormat = "alpha_lower"
        };
        switch (entityType)
        {
            case "course": assessment.CourseId = entityId; break;
            case "module": assessment.ModuleId = entityId; break;
            case "chapter": assessment.ChapterId = entityId; break;
        }
        _context.Assessments.Add(assessment);
        await _context.SaveChangesAsync();

        if (options.GenerateQuestions)
        {
            var genRequest = new AiGenerateRequest
            {
                AssessmentId = assessment.Id,
                Count = 5,
                TypeMode = "single",
                MarksMode = "fixed",
                FixedMark = 1
            };
            try
            {
                var questions = await _aiQuestionService.GenerateAsync(entityName, null, options.Difficulty, genRequest);
                var rng = new Random();
                var sortOrder = 0;
                foreach (var gq in questions)
                {
                    if (string.IsNullOrWhiteSpace(gq.QuestionText)) continue;
                    var isOptionType = gq.QuestionType is "mcq_single" or "mcq_multi";
                    if (isOptionType && (gq.Options.Count < 2 || !gq.Options.Any(o => o.IsCorrect))) continue;

                    var q = new AssessmentQuestion
                    {
                        AssessmentId = assessment.Id,
                        QuestionText = gq.QuestionText.Trim(),
                        QuestionType = gq.QuestionType,
                        MarkingMode = gq.MarkingMode,
                        Mark = gq.MarkingMode == "per_question" ? gq.Mark : null,
                        SortOrder = sortOrder++
                    };
                    _context.AssessmentQuestions.Add(q);
                    await _context.SaveChangesAsync();

                    int oOrder = 0;
                    foreach (var opt in gq.Options.OrderBy(_ => rng.Next()))
                    {
                        _context.AssessmentOptions.Add(new AssessmentOption
                        {
                            QuestionId = q.Id,
                            OptionText = opt.OptionText,
                            IsCorrect = opt.IsCorrect,
                            Mark = gq.MarkingMode == "per_option" ? opt.Mark : null,
                            SortOrder = oOrder++
                        });
                    }
                }
                await _context.SaveChangesAsync();
            }
            catch
            {
                // question generation failure shouldn't block the whole course creation
            }
        }
    }

    private async Task AddChapterImage(int chapterId, string query)
    {
        try
        {
            var imgPath = await _imageService.FindAndSaveImageAsync(query, "chapters/images", _fileStorage);
            if (imgPath == null) return;

            var order = await _context.ChapterMedia.Where(m => m.ChapterId == chapterId).CountAsync();
            _context.ChapterMedia.Add(new ChapterMedia
            {
                ChapterId = chapterId,
                MediaType = "image",
                FilePath = imgPath,
                SortOrder = order
            });
            await _context.SaveChangesAsync();
        }
        catch { /* image failure shouldn't block chapter creation */ }
    }
}