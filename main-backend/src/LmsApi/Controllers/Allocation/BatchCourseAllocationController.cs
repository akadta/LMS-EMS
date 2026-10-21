using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Data;
using dotnet.Models;
using dotnet.LmsApi.Dtos;

namespace dotnet.LmsApi.Controllers;

[Authorize]
[Route("api/lms/batch-courses")]
public class BatchCourseAllocationController : BaseController
{
    private readonly AppDbContext _context;
    public BatchCourseAllocationController(AppDbContext context) { _context = context; }

    [HttpGet("{batchCourseId}")]
    public async Task<IActionResult> GetInfo(int batchCourseId)
    {
        var bc = await _context.BatchCourses.Include(x => x.Course).Include(x => x.Batch)
            .FirstOrDefaultAsync(x => x.Id == batchCourseId);
        if (bc == null) return NotFound(new { success = false, errors = new[] { "Not found." } });

        var allocatedCount = await _context.BatchCourseStudents.CountAsync(a => a.BatchCourseId == batchCourseId);
        var rosterCount = await _context.BatchStudents.CountAsync(s => s.BatchId == bc.BatchId);

        return Ok(new
        {
            success = true,
            data = new
            {
                batchCourseId = bc.Id,
                batchId = bc.BatchId,
                batchName = bc.Batch?.Name,
                courseId = bc.CourseId,
                courseName = bc.Course?.Name,
                allocatedCount,
                rosterCount
            }
        });
    }

    // Search roster students of the batch, flagged with whether already allocated to THIS course
    [HttpGet("{batchCourseId}/roster")]
    public async Task<IActionResult> SearchRoster(int batchCourseId, [FromQuery] string? search, [FromQuery] string filter = "all", [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        var bc = await _context.BatchCourses.FindAsync(batchCourseId);
        if (bc == null) return NotFound(new { success = false, errors = new[] { "Not found." } });

        var allocatedIds = await _context.BatchCourseStudents
            .Where(a => a.BatchCourseId == batchCourseId).Select(a => a.StudentId).ToListAsync();

        var query = _context.BatchStudents.Include(bs => bs.Student).ThenInclude(s => s!.User)
            .Where(bs => bs.BatchId == bc.BatchId);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(bs => bs.Student!.Name.ToLower().Contains(search.ToLower()));

        if (filter == "allocated") query = query.Where(bs => allocatedIds.Contains(bs.StudentId));
        else if (filter == "unallocated") query = query.Where(bs => !allocatedIds.Contains(bs.StudentId));

        var total = await query.CountAsync();
        var items = await query.OrderBy(bs => bs.Student!.Name)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(bs => new StudentSearchResultDto
            {
                Id = bs.Student!.Id,
                Name = bs.Student.Name,
                Email = bs.Student.User != null ? bs.Student.User.Email : null,
                PhotoUrl = string.IsNullOrEmpty(bs.Student.PhotoPath) ? null : $"/storage/{bs.Student.PhotoPath}",
                PhoneNumber = bs.Student.PhoneNumber
            }).ToListAsync();

        foreach (var item in items) item.Allocated = allocatedIds.Contains(item.Id);

        return Ok(new { success = true, data = new PagedResult<StudentSearchResultDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize } });
    }

    [HttpPost("{batchCourseId}/allocate")]
    public async Task<IActionResult> Allocate(int batchCourseId, [FromBody] AddStudentsRequest request)
    {
        var bc = await _context.BatchCourses.FindAsync(batchCourseId);
        if (bc == null) return NotFound(new { success = false, errors = new[] { "Not found." } });

        var rosterIds = await _context.BatchStudents.Where(bs => bs.BatchId == bc.BatchId).Select(bs => bs.StudentId).ToListAsync();
        var existing = await _context.BatchCourseStudents.Where(a => a.BatchCourseId == batchCourseId).Select(a => a.StudentId).ToListAsync();

        var toAdd = request.StudentIds.Distinct().Where(sid => rosterIds.Contains(sid) && !existing.Contains(sid)).ToList();
        foreach (var sid in toAdd)
            _context.BatchCourseStudents.Add(new BatchCourseStudent { BatchCourseId = batchCourseId, StudentId = sid });

        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = new { allocated = toAdd.Count } });
    }

    [HttpPost("{batchCourseId}/allocate-all-matching")]
    public async Task<IActionResult> AllocateAllMatching(int batchCourseId, [FromBody] AddStudentsByFilterRequest request)
    {
        var bc = await _context.BatchCourses.FindAsync(batchCourseId);
        if (bc == null) return NotFound(new { success = false, errors = new[] { "Not found." } });

        var existing = await _context.BatchCourseStudents.Where(a => a.BatchCourseId == batchCourseId).Select(a => a.StudentId).ToListAsync();

        var query = _context.BatchStudents.Include(bs => bs.Student)
            .Where(bs => bs.BatchId == bc.BatchId && !existing.Contains(bs.StudentId));
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(bs => bs.Student!.Name.ToLower().Contains(request.Search.ToLower()));

        var idsToAdd = await query.Select(bs => bs.StudentId).ToListAsync();
        foreach (var sid in idsToAdd)
            _context.BatchCourseStudents.Add(new BatchCourseStudent { BatchCourseId = batchCourseId, StudentId = sid });

        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = new { allocated = idsToAdd.Count } });
    }

    [HttpPost("{batchCourseId}/deallocate")]
    public async Task<IActionResult> Deallocate(int batchCourseId, [FromBody] AddStudentsRequest request)
    {
        var toRemove = await _context.BatchCourseStudents
            .Where(a => a.BatchCourseId == batchCourseId && request.StudentIds.Contains(a.StudentId)).ToListAsync();
        _context.BatchCourseStudents.RemoveRange(toRemove);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = new { removed = toRemove.Count } });
    }
}