namespace dotnet.LmsApi.Dtos;

public class FacultyBatchCourseDto
{
    public int BatchCourseId { get; set; }
    public int BatchId { get; set; }
    public string BatchName { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public int AllocatedStudentCount { get; set; }
}

public class FacultyStudentTrackingDto
{
    public int StudentId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public string? CurrentModuleName { get; set; }
    public string? CurrentChapterName { get; set; }
    public int ModulesCompleted { get; set; }
    public int TotalModules { get; set; }
    public bool HasPendingReview { get; set; }
    public bool IsBlockedOnOverride { get; set; }
}

public class PendingReviewAttemptDto
{
    public int AttemptId { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AssessmentName { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty; // course/module/chapter
    public string EntityLabel { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }
    public string Status { get; set; } = string.Empty;
}

public class AttemptDetailForFacultyDto
{
    public int AttemptId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string AssessmentName { get; set; } = string.Empty;
    public string Mode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public bool? Passed { get; set; }
    public double? Percent { get; set; }
    public bool CanOverride { get; set; }

    public bool AlreadyOverridden { get; set; }
    public List<AttemptAnswerForFacultyDto> Answers { get; set; } = new();
}

public class AttemptAnswerForFacultyDto
{
    public int AnswerId { get; set; }
    public int QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public double? MaxMark { get; set; }
    public List<int>? SelectedOptionIds { get; set; }
    public string? TextAnswer { get; set; }
    public double? MarkAwarded { get; set; }
    public string? FacultyNote { get; set; }
    public List<AttemptOptionInfoDto> Options { get; set; } = new();
}

public class AttemptOptionInfoDto
{
    public int Id { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
}

public class GradeAnswerRequest
{
    public double MarkAwarded { get; set; }
    public string? FacultyNote { get; set; }
}

public class ApproveAttemptRequest
{
    public bool Approve { get; set; }
}

public class OverrideUnlockRequest
{
    public bool Override { get; set; }
}