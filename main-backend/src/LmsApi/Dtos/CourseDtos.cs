namespace dotnet.LmsApi.Dtos;

public class CourseCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class CourseCategoryRequest
{
    public string Name { get; set; } = string.Empty;
}

public class CourseListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public string DifficultyLevel { get; set; } = string.Empty;
    public bool IsDraft { get; set; }
    public bool IsFinalAssessment { get; set; }
    public int ModuleCount { get; set; }
    public string DurationLabel { get; set; } = "-";
    public List<string> Categories { get; set; } = new();
}

public class CourseDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? DurationValue { get; set; }
    public string? DurationUnit { get; set; }
    public string DifficultyLevel { get; set; } = string.Empty;
    public bool IsFinalAssessment { get; set; }
    public bool IsDraft { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public List<int> ImageIds { get; set; } = new();
    public List<CourseCategoryDto> Categories { get; set; } = new();

    public List<CourseFacultyGroupDto> FacultyGroups { get; set; } = new();
}