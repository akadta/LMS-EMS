namespace dotnet.LmsApi.Dtos;

public class StudentBatchDto
{
    public int BatchId { get; set; }
    public string BatchName { get; set; } = string.Empty;
    public int CourseCount { get; set; }
}

public class StudentBatchCourseDto
{
    public int BatchCourseId { get; set; }
    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string? CoverImageUrl { get; set; }
    public bool Enrolled { get; set; }
    public bool Expired { get; set; }
    public bool Completed { get; set; }
    public DateTime? ExpiresAt { get; set; }
}
public class EnrollResponseDto
{
    public int EnrollmentId { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class StudentModuleStatusDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int ChapterCount { get; set; }
    public bool Completed { get; set; }
    public bool Unlocked { get; set; }
    public bool HasGate { get; set; }
    public bool GateCleared { get; set; }
    public string? GateBlockReason { get; set; }
    public int? AssessmentId { get; set; }
}

public class StudentChapterStatusDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public bool Unlocked { get; set; }
    public bool HasGate { get; set; }
    public bool GateCleared { get; set; }
    public string? GateBlockReason { get; set; }
    public int? AssessmentId { get; set; }
}

public class SubmitAttemptAnswerRequest
{
    public int QuestionId { get; set; }
    public List<int>? SelectedOptionIds { get; set; }
    public string? TextAnswer { get; set; }
}

public class SubmitAttemptRequest
{
 public int AttemptId { get; set; }
    public int AssessmentId { get; set; }
        public List<SubmitAttemptAnswerRequest> Answers { get; set; } = new();
}

public class AttemptResultDto
{
    public int AttemptId { get; set; }
    public string Mode { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public double? TotalPossible { get; set; }
    public double? TotalAwarded { get; set; }
    public double? Percent { get; set; }
    public bool? Passed { get; set; }
    public string? Grade { get; set; }
}