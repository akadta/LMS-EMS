namespace dotnet.LmsApi.Dtos;

public class FacultySearchResultDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public string? SubRoleName { get; set; }
    public string? PhoneNumber { get; set; }
}

public class SubRoleOptionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class CourseFacultyMemberDto
{
    public int FacultyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public string? SubRoleName { get; set; }
}

public class CourseFacultyGroupDto
{
    public int Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public List<CourseFacultyMemberDto> Faculties { get; set; } = new();
}

public class CourseFacultyGroupRequest
{
    public string Label { get; set; } = string.Empty;
    public List<int> FacultyIds { get; set; } = new();
}

public class ReviewQueueCourseDto
{
    public int BatchCourseId { get; set; }
    public string BatchName { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int PendingCount { get; set; }
}

public class ReviewQueueStudentDto
{
    public int StudentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public int PendingCount { get; set; }
}