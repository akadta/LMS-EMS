namespace dotnet.LmsApi.Dtos;

public class BatchListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int StudentCount { get; set; }
    public int CourseCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BatchRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class StudentSearchResultDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PhotoUrl { get; set; }
    public string? PhoneNumber { get; set; }
    public bool InBatch { get; set; } // for roster search: already added?
    public bool Allocated { get; set; } // for course-allocation search: already allocated?
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class BatchDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int StudentCount { get; set; }
}

public class BatchCourseListItemDto
{
    public int BatchCourseId { get; set; }
    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public int AllocatedCount { get; set; }
    public int RosterCount { get; set; }
}

public class AddStudentsRequest
{
    public List<int> StudentIds { get; set; } = new();
}

public class AddStudentsByFilterRequest
{
    public string? Search { get; set; }
}

public class AddCourseToBatchRequest
{
    public int CourseId { get; set; }
}