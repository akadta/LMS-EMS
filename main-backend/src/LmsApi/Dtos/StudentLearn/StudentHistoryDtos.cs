namespace dotnet.LmsApi.Dtos;

public class StudentHistoryBatchDto
{
    public int BatchId { get; set; }
    public string BatchName { get; set; } = string.Empty;
    public List<StudentHistoryCourseDto> Courses { get; set; } = new();
}

public class StudentHistoryCourseDto
{
    public int BatchCourseId { get; set; }
    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public bool Enrolled { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool Expired { get; set; }
    public bool Completed { get; set; }
    public int ModulesCompleted { get; set; }
    public int TotalModules { get; set; }
}

public class StudentHistoryModuleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public bool HasGate { get; set; }
    public string? GateStatus { get; set; }
    public StudentHistoryAssessmentSummaryDto? Assessment { get; set; }
    public List<StudentHistoryChapterDto> Chapters { get; set; } = new();
}

public class StudentHistoryChapterDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool HasGate { get; set; }
    public string? GateStatus { get; set; }
    public StudentHistoryAssessmentSummaryDto? Assessment { get; set; }
}

public class StudentHistoryAssessmentSummaryDto
{
    public int AssessmentId { get; set; }
    public string AssessmentName { get; set; } = string.Empty;
    public string Mode { get; set; } = string.Empty;
    public List<StudentHistoryAttemptDto> Attempts { get; set; } = new();
}

public class StudentHistoryAttemptDto
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

public class StudentAttemptAnswerDetailDto
{
    public int AnswerId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public double? MaxMark { get; set; }
    public double? MarkAwarded { get; set; }
    public List<int>? SelectedOptionIds { get; set; }
    public string? TextAnswer { get; set; }
    public string? FacultyNote { get; set; }
    public List<StudentAttemptOptionDto> Options { get; set; } = new();
}

public class StudentAttemptOptionDto
{
    public int Id { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class StudentAttemptDetailDto
{
    public int AttemptId { get; set; }
    public string AssessmentName { get; set; } = string.Empty;
    public string Mode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool? Passed { get; set; }
    public double? Percent { get; set; }
    public double? TotalPossible { get; set; }
    public double? TotalAwarded { get; set; }
    public string? Grade { get; set; }
    public bool RevealAnswers { get; set; }
    public List<StudentAttemptAnswerDetailDto> Answers { get; set; } = new();
}