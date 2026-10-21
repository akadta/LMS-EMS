using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Data;
using dotnet.Models;
using dotnet.LmsApi.Dtos;
using dotnet.Shared.Services;

namespace dotnet.LmsApi.Controllers;

[Authorize]
[Route("api/lms/chapters")]
public class ChaptersController : BaseController
{
    private readonly AppDbContext _context;
    private readonly IFileStorageService _fileStorage;

    public ChaptersController(AppDbContext context, IFileStorageService fileStorage)
    {
        _context = context;
        _fileStorage = fileStorage;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int moduleId)
    {
        var module = await _context.Modules.FindAsync(moduleId);
        if (module == null) return NotFound(new { success = false, errors = new[] { "Module not found." } });

        var chapters = await _context.Chapters.Include(c => c.Media)
            .Where(c => c.ModuleId == moduleId)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Id)
            .ToListAsync();

        var data = chapters.Select(c => new ChapterListItemDto
        {
            Id = c.Id,
            ModuleId = c.ModuleId,
            Name = c.Name,
            IsFinalAssessment = c.IsFinalAssessment,
            IsDraft = c.IsDraft,
            MediaCount = c.Media.Count,
            ThumbnailUrl = c.Media.Where(m => m.MediaType == "image").OrderBy(m => m.SortOrder)
                .Select(m => $"/storage/{m.FilePath}").FirstOrDefault()
        }).ToList();

        return Ok(new { success = true, data = new { module = new { module.Id, module.Name }, chapters = data } });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var chapter = await _context.Chapters.Include(c => c.Media).FirstOrDefaultAsync(c => c.Id == id);
        if (chapter == null) return NotFound(new { success = false, errors = new[] { "Chapter not found." } });

        var dto = new ChapterDetailDto
        {
            Id = chapter.Id,
            ModuleId = chapter.ModuleId,
            Name = chapter.Name,
            Description = chapter.Description,
            IsFinalAssessment = chapter.IsFinalAssessment,
            IsDraft = chapter.IsDraft,
            IsPass = chapter.IsPass,
            IsReviewUnlock = chapter.IsReviewUnlock,
            Media = chapter.Media.OrderBy(m => m.SortOrder).Select(m => new ChapterMediaDto
            {
                Id = m.Id,
                MediaType = m.MediaType,
                Url = $"/storage/{m.FilePath}",
                Caption = m.Caption
            }).ToList()
        };

        return Ok(new { success = true, data = dto });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromForm] ChapterFormRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { success = false, errors = new[] { "Chapter name is required." } });

        var module = await _context.Modules.FindAsync(request.ModuleId);
        if (module == null) return NotFound(new { success = false, errors = new[] { "Module not found." } });

        var sortOrder = await _context.Chapters.Where(c => c.ModuleId == request.ModuleId).CountAsync();

        var chapter = new Chapter
        {
            ModuleId = request.ModuleId,
            Name = request.Name.Trim(),
            Description = request.Description,
            IsFinalAssessment = request.IsFinalAssessment,
            IsDraft = request.IsDraft,
            SortOrder = sortOrder,
            IsPass = request.IsPass,
            IsReviewUnlock = request.IsReviewUnlock,
        };
        _context.Chapters.Add(chapter);
        await _context.SaveChangesAsync();

        await SaveMedia(chapter.Id, "image", request.Images);
        await SaveMedia(chapter.Id, "video", request.Videos);
        await SaveMedia(chapter.Id, "document", request.Documents);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { id = chapter.Id } });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromForm] ChapterFormRequest request)
    {
        var chapter = await _context.Chapters.Include(c => c.Media).FirstOrDefaultAsync(c => c.Id == id);
        if (chapter == null) return NotFound(new { success = false, errors = new[] { "Chapter not found." } });

        chapter.Name = request.Name.Trim();
        chapter.Description = request.Description;
        chapter.IsFinalAssessment = request.IsFinalAssessment;
        chapter.IsDraft = request.IsDraft;
        chapter.UpdatedAt = DateTime.UtcNow;
        chapter.IsPass = request.IsPass;
        chapter.IsReviewUnlock = request.IsReviewUnlock;

        var keepIds = request.KeepMediaIds ?? new List<int>();
        var toRemove = chapter.Media.Where(m => !keepIds.Contains(m.Id)).ToList();
        foreach (var m in toRemove)
        {
            _fileStorage.DeleteFile(m.FilePath);
            _context.ChapterMedia.Remove(m);
        }

        await SaveMedia(chapter.Id, "image", request.Images);
        await SaveMedia(chapter.Id, "video", request.Videos);
        await SaveMedia(chapter.Id, "document", request.Documents);

        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = new { id = chapter.Id } });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var chapter = await _context.Chapters.Include(c => c.Media).FirstOrDefaultAsync(c => c.Id == id);
        if (chapter == null) return NotFound(new { success = false, errors = new[] { "Chapter not found." } });

        foreach (var m in chapter.Media) _fileStorage.DeleteFile(m.FilePath);
        _context.Chapters.Remove(chapter);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    private async Task SaveMedia(int chapterId, string type, List<IFormFile>? files)
    {
        if (files == null) return;
        var order = await _context.ChapterMedia.Where(m => m.ChapterId == chapterId).CountAsync();
        foreach (var file in files)
        {
            var path = await _fileStorage.SaveFileAsync(file, $"chapters/{type}s");
            _context.ChapterMedia.Add(new ChapterMedia { ChapterId = chapterId, MediaType = type, FilePath = path, SortOrder = order++ });
        }
    }

    [HttpPut("{id}/gating")]
    public async Task<IActionResult> UpdateGating(int id, [FromBody] ChapterGatingRequest request)
    {
        var chapter = await _context.Chapters.FirstOrDefaultAsync(c => c.Id == id);
        if (chapter == null) return NotFound(new { success = false, errors = new[] { "Chapter not found." } });

        chapter.IsPass = request.IsPass;
        chapter.IsReviewUnlock = request.IsReviewUnlock;
        chapter.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { chapter.IsPass, chapter.IsReviewUnlock } });
    }
}

public class ChapterFormRequest
{
    public int ModuleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsFinalAssessment { get; set; }
    public bool IsDraft { get; set; } = true;
    public List<IFormFile>? Images { get; set; }
    public List<IFormFile>? Videos { get; set; }
    public List<IFormFile>? Documents { get; set; }
    public List<int>? KeepMediaIds { get; set; }

    public bool IsPass { get; set; }
    public bool IsReviewUnlock { get; set; }
}