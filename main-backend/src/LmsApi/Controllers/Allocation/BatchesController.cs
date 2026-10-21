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
[Route("api/lms/batches")]
public class BatchesController : BaseController
{
    private readonly AppDbContext _context;
    public BatchesController(AppDbContext context) { _context = context; }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var query = _context.Batches.Include(b => b.Students).Include(b => b.Courses)
            .Where(b => b.OrganizationId == scope.OrganizationId);
        if (scope.CompanyId != null) query = query.Where(b => b.CompanyId == scope.CompanyId);
        if (scope.DepartmentId != null) query = query.Where(b => b.DepartmentId == scope.DepartmentId);

        var batches = await query.OrderByDescending(b => b.CreatedAt).ToListAsync();

        var data = batches.Select(b => new BatchListItemDto
        {
            Id = b.Id,
            Name = b.Name,
            Description = b.Description,
            IsActive = b.IsActive,
            StudentCount = b.Students.Count,
            CourseCount = b.Courses.Count,
            CreatedAt = b.CreatedAt
        }).ToList();

        return Ok(new { success = true, data });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var batch = await _context.Batches.Include(b => b.Students)
            .FirstOrDefaultAsync(b => b.Id == id && b.OrganizationId == scope.OrganizationId);
        if (batch == null) return NotFound(new { success = false, errors = new[] { "Batch not found." } });

        return Ok(new
        {
            success = true,
            data = new BatchDetailDto
            {
                Id = batch.Id,
                Name = batch.Name,
                Description = batch.Description,
                IsActive = batch.IsActive,
                StudentCount = batch.Students.Count
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BatchRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { success = false, errors = new[] { "Batch name is required." } });

        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var batch = new Batch
        {
            OrganizationId = scope.OrganizationId,
            CompanyId = scope.CompanyId,
            DepartmentId = scope.DepartmentId,
            Name = request.Name.Trim(),
            Description = request.Description
        };
        _context.Batches.Add(batch);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { id = batch.Id } });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] BatchRequest request)
    {
        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var batch = await _context.Batches.FirstOrDefaultAsync(b => b.Id == id && b.OrganizationId == scope.OrganizationId);
        if (batch == null) return NotFound(new { success = false, errors = new[] { "Batch not found." } });

        batch.Name = request.Name.Trim();
        batch.Description = request.Description;
        batch.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { success = true });
    }

    [HttpPut("{id}/toggle-active")]
    public async Task<IActionResult> ToggleActive(int id)
    {
        var batch = await _context.Batches.FindAsync(id);
        if (batch == null) return NotFound(new { success = false, errors = new[] { "Batch not found." } });

        batch.IsActive = !batch.IsActive;
        batch.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { isActive = batch.IsActive } });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var batch = await _context.Batches.FirstOrDefaultAsync(b => b.Id == id && b.OrganizationId == scope.OrganizationId);
        if (batch == null) return NotFound(new { success = false, errors = new[] { "Batch not found." } });

        _context.Batches.Remove(batch); // cascades to BatchStudents/BatchCourses via FK if configured; otherwise EF will handle in-memory graph if loaded
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ---- Roster (batch-level students) ----

    [HttpGet("{id}/roster")]
    public async Task<IActionResult> GetRoster(int id, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        var query = _context.BatchStudents.Include(bs => bs.Student).ThenInclude(s => s!.User)
            .Where(bs => bs.BatchId == id);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(bs => bs.Student!.Name.ToLower().Contains(search.ToLower()));

        var total = await query.CountAsync();
        var items = await query.OrderBy(bs => bs.Student!.Name)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(bs => new StudentSearchResultDto
            {
                Id = bs.Student!.Id,
                Name = bs.Student.Name,
                Email = bs.Student.User != null ? bs.Student.User.Email : null,
                PhotoUrl = string.IsNullOrEmpty(bs.Student.PhotoPath) ? null : $"/storage/{bs.Student.PhotoPath}",
                PhoneNumber = bs.Student.PhoneNumber,
                InBatch = true
            }).ToListAsync();

        return Ok(new { success = true, data = new PagedResult<StudentSearchResultDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize } });
    }

    [HttpGet("{id}/roster/search-available")]
    public async Task<IActionResult> SearchAvailableStudents(int id, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 25)
    {
        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var alreadyInBatch = await _context.BatchStudents.Where(bs => bs.BatchId == id).Select(bs => bs.StudentId).ToListAsync();

        var query = _context.Students.Include(s => s.User)
            .Where(s => s.OrganizationId == scope.OrganizationId && !alreadyInBatch.Contains(s.Id));
        if (scope.CompanyId != null) query = query.Where(s => s.CompanyId == scope.CompanyId);
        if (scope.DepartmentId != null) query = query.Where(s => s.DepartmentId == scope.DepartmentId);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(s => s.Name.ToLower().Contains(search.ToLower()));

        var total = await query.CountAsync();
        var items = await query.OrderBy(s => s.Name)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(s => new StudentSearchResultDto
            {
                Id = s.Id,
                Name = s.Name,
                Email = s.User != null ? s.User.Email : null,
                PhotoUrl = string.IsNullOrEmpty(s.PhotoPath) ? null : $"/storage/{s.PhotoPath}",
                PhoneNumber = s.PhoneNumber,
                InBatch = false
            }).ToListAsync();

        return Ok(new { success = true, data = new PagedResult<StudentSearchResultDto> { Items = items, TotalCount = total, Page = page, PageSize = pageSize } });
    }

    [HttpPost("{id}/roster")]
    public async Task<IActionResult> AddStudentsToRoster(int id, [FromBody] AddStudentsRequest request)
    {
        var batch = await _context.Batches.FindAsync(id);
        if (batch == null) return NotFound(new { success = false, errors = new[] { "Batch not found." } });

        var existing = await _context.BatchStudents.Where(bs => bs.BatchId == id).Select(bs => bs.StudentId).ToListAsync();
        var toAdd = request.StudentIds.Distinct().Except(existing).ToList();

        foreach (var sid in toAdd)
            _context.BatchStudents.Add(new BatchStudent { BatchId = id, StudentId = sid });

        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = new { added = toAdd.Count } });
    }

    [HttpPost("{id}/roster/add-by-filter")]
    public async Task<IActionResult> AddAllMatchingToRoster(int id, [FromBody] AddStudentsByFilterRequest request)
    {
        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var alreadyInBatch = await _context.BatchStudents.Where(bs => bs.BatchId == id).Select(bs => bs.StudentId).ToListAsync();

        var query = _context.Students.Where(s => s.OrganizationId == scope.OrganizationId && !alreadyInBatch.Contains(s.Id));
        if (scope.CompanyId != null) query = query.Where(s => s.CompanyId == scope.CompanyId);
        if (scope.DepartmentId != null) query = query.Where(s => s.DepartmentId == scope.DepartmentId);
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(s => s.Name.ToLower().Contains(request.Search.ToLower()));

        var idsToAdd = await query.Select(s => s.Id).ToListAsync();
        foreach (var sid in idsToAdd)
            _context.BatchStudents.Add(new BatchStudent { BatchId = id, StudentId = sid });

        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = new { added = idsToAdd.Count } });
    }

    [HttpDelete("{id}/roster/{studentId}")]
    public async Task<IActionResult> RemoveFromRoster(int id, int studentId)
    {
        var bs = await _context.BatchStudents.FirstOrDefaultAsync(x => x.BatchId == id && x.StudentId == studentId);
        if (bs == null) return NotFound(new { success = false, errors = new[] { "Student not in batch." } });

        // also remove from any course allocations within this batch
        var batchCourseIds = await _context.BatchCourses.Where(bc => bc.BatchId == id).Select(bc => bc.Id).ToListAsync();
        var allocations = await _context.BatchCourseStudents
            .Where(a => batchCourseIds.Contains(a.BatchCourseId) && a.StudentId == studentId).ToListAsync();
        _context.BatchCourseStudents.RemoveRange(allocations);

        _context.BatchStudents.Remove(bs);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ---- Courses attached to batch ----

    [HttpGet("{id}/courses")]
    public async Task<IActionResult> GetBatchCourses(int id)
    {
        var batchCourses = await _context.BatchCourses
            .Include(bc => bc.Course).ThenInclude(c => c!.Images)
            .Include(bc => bc.AllocatedStudents)
            .Where(bc => bc.BatchId == id)
            .ToListAsync();

        var rosterCount = await _context.BatchStudents.CountAsync(bs => bs.BatchId == id);

        var data = batchCourses.Select(bc => new BatchCourseListItemDto
        {
            BatchCourseId = bc.Id,
            CourseId = bc.CourseId,
            CourseName = bc.Course?.Name ?? "",
            CoverImageUrl = bc.Course?.Images.OrderBy(i => i.SortOrder).Select(i => $"/storage/{i.ImagePath}").FirstOrDefault(),
            AllocatedCount = bc.AllocatedStudents.Count,
            RosterCount = rosterCount
        }).ToList();

        return Ok(new { success = true, data });
    }

    [HttpGet("{id}/available-courses")]
    public async Task<IActionResult> GetAvailableCourses(int id, [FromQuery] string? search)
    {
        var scope = await ScopeResolver.ResolveAsync(_context, CurrentSystemRoleSlug, CurrentUserId);
        if (scope == null) return Unauthorized(new { success = false, errors = new[] { "Not authorized." } });

        var alreadyAdded = await _context.BatchCourses.Where(bc => bc.BatchId == id).Select(bc => bc.CourseId).ToListAsync();

        var query = ScopeResolver.ApplyCourseScope(
            _context.Courses.Where(c => c.IsActive && !alreadyAdded.Contains(c.Id)), scope);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Name.ToLower().Contains(search.ToLower()));

        var courses = await query.OrderBy(c => c.Name).Take(30)
            .Select(c => new { c.Id, c.Name }).ToListAsync();

        return Ok(new { success = true, data = courses });
    }

    [HttpPost("{id}/courses")]
    public async Task<IActionResult> AddCourseToBatch(int id, [FromBody] AddCourseToBatchRequest request)
    {
        var batch = await _context.Batches.FindAsync(id);
        if (batch == null) return NotFound(new { success = false, errors = new[] { "Batch not found." } });

        var exists = await _context.BatchCourses.AnyAsync(bc => bc.BatchId == id && bc.CourseId == request.CourseId);
        if (exists) return BadRequest(new { success = false, errors = new[] { "This course is already added to the batch." } });

        var bc2 = new BatchCourse { BatchId = id, CourseId = request.CourseId };
        _context.BatchCourses.Add(bc2);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, data = new { batchCourseId = bc2.Id } });
    }

    [HttpDelete("{id}/courses/{batchCourseId}")]
    public async Task<IActionResult> RemoveCourseFromBatch(int id, int batchCourseId)
    {
        var bc = await _context.BatchCourses.Include(x => x.AllocatedStudents)
            .FirstOrDefaultAsync(x => x.Id == batchCourseId && x.BatchId == id);
        if (bc == null) return NotFound(new { success = false, errors = new[] { "Not found." } });

        _context.BatchCourseStudents.RemoveRange(bc.AllocatedStudents);
        _context.BatchCourses.Remove(bc);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }
}