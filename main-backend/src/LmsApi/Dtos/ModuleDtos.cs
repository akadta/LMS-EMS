namespace dotnet.LmsApi.Dtos;

public class ModuleListItemDto
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string DifficultyLevel { get; set; } = string.Empty;
    public string DurationLabel { get; set; } = "-";
    public bool IsLock { get; set; }
    public bool IsFinalAssessment { get; set; }
    public bool IsDraft { get; set; }
    public int ChapterCount { get; set; }
}

public class ModuleDetailDto
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string DifficultyLevel { get; set; } = string.Empty;
    public int? DurationValue { get; set; }
    public string? DurationUnit { get; set; }
    public bool IsLock { get; set; }
    public bool IsFinalAssessment { get; set; }
    public bool IsDraft { get; set; }
    public int RemainingCourseDurationDays { get; set; }

    public bool IsPass { get; set; }
    public bool IsReviewUnlock { get; set; }
}

public class ModuleGatingRequest
{
    public bool IsPass { get; set; }
    public bool IsReviewUnlock { get; set; }
}