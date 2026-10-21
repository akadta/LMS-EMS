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
[Route("api/lms/assessment-questions")]
public class AssessmentQuestionsController : BaseController
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;
    private readonly IAiQuestionService _aiService;

    public AssessmentQuestionsController(AppDbContext context, IFileStorageService fileStorage, IAiQuestionService aiService)
    {
        _context = context;
        _fileStorage = fileStorage;
        _aiService = aiService;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int assessmentId)
    {
        var questions = await _context.AssessmentQuestions
            .Include(q => q.Options).Include(q => q.Media)
            .Where(q => q.AssessmentId == assessmentId)
            .OrderBy(q => q.SortOrder).ThenBy(q => q.Id)
            .ToListAsync();

        return Ok(new { success = true, data = questions.Select(ToDto).ToList() });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var question = await _context.AssessmentQuestions.Include(q => q.Options).Include(q => q.Media)
            .FirstOrDefaultAsync(q => q.Id == id);
        if (question == null) return NotFound(new { success = false, errors = new[] { "Question not found." } });
        return Ok(new { success = true, data = ToDto(question) });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromForm] QuestionFormRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.QuestionText))
            return BadRequest(new { success = false, errors = new[] { "Question text is required." } });

        var assessment = await _context.Assessments.FindAsync(request.AssessmentId);
        if (assessment == null) return NotFound(new { success = false, errors = new[] { "Assessment not found." } });

        var isOptionType = request.QuestionType is "mcq_single" or "mcq_multi";
        var options = ParseOptions(request.OptionsJson);

        if (isOptionType)
        {
            if (options.Count < 2)
                return BadRequest(new { success = false, errors = new[] { "At least 2 options are required." } });
            if (!options.Any(o => o.IsCorrect))
                return BadRequest(new { success = false, errors = new[] { "Mark at least one correct answer." } });
            if (request.MarkingMode == "per_option" && options.Any(o => o.IsCorrect && o.Mark == null))
                return BadRequest(new { success = false, errors = new[] { "Set marks for each correct option." } });
        }
        if (!isOptionType && assessment.Mode != "review")
            return BadRequest(new { success = false, errors = new[] { "Short/long answer questions require Review mode." } });

        var sortOrder = await _context.AssessmentQuestions.Where(q => q.AssessmentId == request.AssessmentId).CountAsync();

        var question = new AssessmentQuestion
        {
            AssessmentId = request.AssessmentId,
            QuestionText = request.QuestionText.Trim(),
            QuestionType = request.QuestionType,
            MarkingMode = request.MarkingMode,
            Mark = request.MarkingMode == "per_question" ? request.Mark : null,
            SortOrder = sortOrder
        };
        _context.AssessmentQuestions.Add(question);
        await _context.SaveChangesAsync();

        if (isOptionType)
        {
            int oOrder = 0;
            foreach (var opt in options)
            {
                _context.AssessmentOptions.Add(new AssessmentOption
                {
                    QuestionId = question.Id,
                    OptionText = opt.OptionText,
                    IsCorrect = opt.IsCorrect,
                    Mark = request.MarkingMode == "per_option" ? opt.Mark : null,
                    SortOrder = oOrder++
                });
            }
        }

        await SaveMedia(question.Id, "image", request.Images);
        await SaveMedia(question.Id, "video", request.Videos);
        await SaveMedia(question.Id, "document", request.Documents);
        await _context.SaveChangesAsync();

        var saved = await _context.AssessmentQuestions.Include(q => q.Options).Include(q => q.Media)
            .FirstAsync(q => q.Id == question.Id);
        return Ok(new { success = true, data = ToDto(saved) });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromForm] QuestionFormRequest request)
    {
        var question = await _context.AssessmentQuestions.Include(q => q.Options).Include(q => q.Media)
            .FirstOrDefaultAsync(q => q.Id == id);
        if (question == null) return NotFound(new { success = false, errors = new[] { "Question not found." } });

        var assessment = await _context.Assessments.FindAsync(question.AssessmentId);
        if (assessment == null) return NotFound(new { success = false, errors = new[] { "Assessment not found." } });

        var isOptionType = request.QuestionType is "mcq_single" or "mcq_multi";
        var options = ParseOptions(request.OptionsJson);

        if (isOptionType)
        {
            if (options.Count < 2)
                return BadRequest(new { success = false, errors = new[] { "At least 2 options are required." } });
            if (!options.Any(o => o.IsCorrect))
                return BadRequest(new { success = false, errors = new[] { "Mark at least one correct answer." } });
        }

        question.QuestionText = request.QuestionText.Trim();
        question.QuestionType = request.QuestionType;
        question.MarkingMode = request.MarkingMode;
        question.Mark = request.MarkingMode == "per_question" ? request.Mark : null;
        question.UpdatedAt = DateTime.UtcNow;

        _context.AssessmentOptions.RemoveRange(question.Options);
        if (isOptionType)
        {
            int oOrder = 0;
            foreach (var opt in options)
            {
                _context.AssessmentOptions.Add(new AssessmentOption
                {
                    QuestionId = question.Id,
                    OptionText = opt.OptionText,
                    IsCorrect = opt.IsCorrect,
                    Mark = request.MarkingMode == "per_option" ? opt.Mark : null,
                    SortOrder = oOrder++
                });
            }
        }

        var keepIds = request.KeepMediaIds ?? new List<int>();
        var toRemove = question.Media.Where(m => !keepIds.Contains(m.Id)).ToList();
        foreach (var m in toRemove)
        {
            _fileStorage.DeleteFile(m.FilePath);
            _context.AssessmentQuestionMedia.Remove(m);
        }

        await SaveMedia(question.Id, "image", request.Images);
        await SaveMedia(question.Id, "video", request.Videos);
        await SaveMedia(question.Id, "document", request.Documents);

        await _context.SaveChangesAsync();

        var saved = await _context.AssessmentQuestions.Include(q => q.Options).Include(q => q.Media)
            .FirstAsync(q => q.Id == question.Id);
        return Ok(new { success = true, data = ToDto(saved) });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var question = await _context.AssessmentQuestions.Include(q => q.Media).FirstOrDefaultAsync(q => q.Id == id);
        if (question == null) return NotFound(new { success = false, errors = new[] { "Question not found." } });

        foreach (var m in question.Media) _fileStorage.DeleteFile(m.FilePath);
        _context.AssessmentQuestions.Remove(question);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    private async Task SaveMedia(int questionId, string type, List<IFormFile>? files)
    {
        if (files == null) return;
        var order = await _context.AssessmentQuestionMedia.Where(m => m.QuestionId == questionId).CountAsync();
        foreach (var file in files)
        {
            var path = await _fileStorage.SaveFileAsync(file, $"assessments/{type}s");
            _context.AssessmentQuestionMedia.Add(new AssessmentQuestionMedia { QuestionId = questionId, MediaType = type, FilePath = path, SortOrder = order++ });
        }
    }

    private static List<AssessmentOptionRequest> ParseOptions(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try
        {
            return JsonSerializer.Deserialize<List<AssessmentOptionRequest>>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();
        }
        catch { return new(); }
    }

    private static AssessmentQuestionDto ToDto(AssessmentQuestion q) => new()
    {
        Id = q.Id,
        AssessmentId = q.AssessmentId,
        QuestionText = q.QuestionText,
        QuestionType = q.QuestionType,
        MarkingMode = q.MarkingMode,

        Mark = q.Mark,
        SortOrder = q.SortOrder,
        Options = q.Options.OrderBy(o => o.SortOrder).Select(o => new AssessmentOptionDto
        {
            Id = o.Id,
            OptionText = o.OptionText,
            IsCorrect = o.IsCorrect,
            Mark = o.Mark
        }).ToList(),
        Media = q.Media.OrderBy(m => m.SortOrder).Select(m => new AssessmentQuestionMediaDto
        {
            Id = m.Id,
            MediaType = m.MediaType,
            Url = $"/storage/{m.FilePath}"
        }).ToList()
    };




    [HttpPost("ai-generate")]
    public async Task<IActionResult> AiGenerate([FromBody] AiGenerateRequest request)
    {
        var assessment = await _context.Assessments.FindAsync(request.AssessmentId);
        if (assessment == null) return NotFound(new { success = false, errors = new[] { "Assessment not found." } });
        var needsReviewMode = request.TypeMode is "short" or "long" or "mixed_all" or "mixed_written";
        if (needsReviewMode && assessment.Mode != "review")
            return BadRequest(new { success = false, errors = new[] { "Short/Long answer generation requires the assessment to be in Review mode." } });

        string title; string? description; string? difficultyLevel = null;

        if (assessment.CourseId != null)
        {
            var c = await _context.Courses.FindAsync(assessment.CourseId);
            title = c?.Name ?? "Course";
            description = c?.Description;
            difficultyLevel = c?.DifficultyLevel;
        }
        else if (assessment.ModuleId != null)
        {
            var m = await _context.Modules.FindAsync(assessment.ModuleId);
            title = m?.Name ?? "Module";
            description = m?.Description;
            difficultyLevel = m?.DifficultyLevel;
        }
        else
        {
            var ch = await _context.Chapters.FindAsync(assessment.ChapterId);
            title = ch?.Name ?? "Chapter";
            description = ch?.Description;

            // Chapters don't have their own difficulty — inherit from parent module
            if (ch != null)
            {
                var parentModule = await _context.Modules.FindAsync(ch.ModuleId);
                difficultyLevel = parentModule?.DifficultyLevel;
            }
        }

        if (request.Count < 1 || request.Count > 20)
            return BadRequest(new { success = false, errors = new[] { "Count must be between 1 and 20." } });

        try
        {
           var generated = await _aiService.GenerateAsync(title, description, difficultyLevel, request);

var rng = new Random();
foreach (var q in generated)
{
    if (q.QuestionType == "mcq_multi" && q.Options.Count > 0)
    {
        var correctOptions = q.Options.Where(o => o.IsCorrect).ToList();
        var targetCount = request.CorrectCountMode == "fixed"
            ? request.FixedCorrectCount
            : rng.Next(request.MinCorrectCount, request.MaxCorrectCount + 1);

        // clamp so we never ask for more correct options than exist
        targetCount = Math.Min(targetCount, q.Options.Count - 1); // leave at least 1 wrong option
        targetCount = Math.Max(targetCount, 2); // mcq_multi needs at least 2 correct

        if (correctOptions.Count > targetCount)
        {
            // too many correct — demote the extras to incorrect
            var toDemote = correctOptions.OrderBy(_ => rng.Next()).Skip(targetCount).ToList();
            foreach (var opt in toDemote)
            {
                opt.IsCorrect = false;
                opt.Mark = null;
            }
        }
        else if (correctOptions.Count < targetCount)
        {
            // too few correct — promote random incorrect ones
            var incorrectOptions = q.Options.Where(o => !o.IsCorrect).OrderBy(_ => rng.Next()).ToList();
            var needed = targetCount - correctOptions.Count;
            foreach (var opt in incorrectOptions.Take(needed))
                opt.IsCorrect = true;

            // redistribute marks if per_option mode
            if (q.MarkingMode == "per_option")
            {
                var newCorrectOptions = q.Options.Where(o => o.IsCorrect).ToList();
                var totalMark = correctOptions.Sum(o => o.Mark ?? 0);
                if (request.OptionMarkDistribution == "same" && newCorrectOptions.Count > 0)
                {
                    var perOptionMark = correctOptions.FirstOrDefault()?.Mark ?? (totalMark / Math.Max(correctOptions.Count, 1));
                    foreach (var opt in newCorrectOptions) opt.Mark = perOptionMark;
                }
                else
                {
                    foreach (var opt in newCorrectOptions.Where(o => o.Mark == null))
                        opt.Mark = Math.Round(request.MinMark + rng.NextDouble() * (request.MaxMark - request.MinMark), 1);
                }
            }
        }

        q.Options = q.Options.OrderBy(_ => rng.Next()).ToList();
    }
    else if (q.Options.Count > 1)
    {
        q.Options = q.Options.OrderBy(_ => rng.Next()).ToList();
    }
}

return Ok(new { success = true, data = generated });
        }
        catch (Exception)
        {
            return BadRequest(new { success = false, errors = new[] { "AI generation failed. Try again." } });
        }
    }

    [HttpPost("ai-commit")]
    public async Task<IActionResult> AiCommit([FromBody] AiCommitRequest request)
    {
        var assessment = await _context.Assessments.FindAsync(request.AssessmentId);
        if (assessment == null) return NotFound(new { success = false, errors = new[] { "Assessment not found." } });



        var sortOrder = await _context.AssessmentQuestions.Where(q => q.AssessmentId == request.AssessmentId).CountAsync();
        var saved = new List<AssessmentQuestion>();

        foreach (var gq in request.Questions)
        {
            if (string.IsNullOrWhiteSpace(gq.QuestionText)) continue;
            var isOptionType = gq.QuestionType is "mcq_single" or "mcq_multi";
            if (isOptionType && (gq.Options.Count < 2 || !gq.Options.Any(o => o.IsCorrect))) continue;

            var q = new AssessmentQuestion
            {
                AssessmentId = request.AssessmentId,
                QuestionText = gq.QuestionText.Trim(),
                QuestionType = gq.QuestionType,
                MarkingMode = gq.MarkingMode,
                Mark = gq.MarkingMode == "per_question" ? gq.Mark : null,
                SortOrder = sortOrder++
            };
            _context.AssessmentQuestions.Add(q);
            await _context.SaveChangesAsync();

            int oOrder = 0;
            foreach (var opt in gq.Options)
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
            saved.Add(q);
        }
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { count = saved.Count } });
    }
}