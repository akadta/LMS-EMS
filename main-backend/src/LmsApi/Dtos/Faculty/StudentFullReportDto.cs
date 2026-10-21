namespace dotnet.LmsApi.Dtos;

public class StudentFullReportDto
{
    public int StudentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public int ModulesCompleted { get; set; }
    public int TotalModules { get; set; }
    public List<ModuleReportDto> Modules { get; set; } = new();
}

public class ModuleReportDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public bool HasGate { get; set; }
    public AttemptSummaryDto? Assessment { get; set; }
    public List<ChapterReportDto> Chapters { get; set; } = new();
}

public class ChapterReportDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool HasGate { get; set; }
    public AttemptSummaryDto? Assessment { get; set; }
}

public class AttemptSummaryDto
{
    public int AssessmentId { get; set; }
    public string AssessmentName { get; set; } = string.Empty;
    public string Mode { get; set; } = string.Empty;
    public List<AttemptHistoryItemDto> Attempts { get; set; } = new();
}

public class AttemptHistoryItemDto
{
    public int AttemptId { get; set; }
    public string Status { get; set; } = string.Empty;
    public double? TotalPossible { get; set; }
    public double? TotalAwarded { get; set; }
    public double? Percent { get; set; }
    public bool? Passed { get; set; }
    public string? Grade { get; set; }
    public bool FacultyOverrideUnlock { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
public class StudentCourseOverviewDto
{
    public int StudentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public int ModulesCompleted { get; set; }
    public int TotalModules { get; set; }
    public List<ModuleListItemForStudentDto> Modules { get; set; } = new();
}

public class ModuleListItemForStudentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public bool HasGate { get; set; }
    public string? GateStatus { get; set; } // not_gated | not_attempted | pending_review | failed_blocked | passed | approved
    public int ChapterCount { get; set; }
    public int ChaptersCompleted { get; set; }
}

public class ModuleDetailForStudentDto
{
    public int ModuleId { get; set; }
    public string ModuleName { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public AttemptSummaryDto? ModuleAssessment { get; set; }
    public List<ChapterListItemForStudentDto> Chapters { get; set; } = new();
}

public class ChapterListItemForStudentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool HasGate { get; set; }
    public string? GateStatus { get; set; }
    public int? AssessmentId { get; set; }
}