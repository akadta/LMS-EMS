namespace dotnet.LmsApi.Dtos;

public class ProctoringSettingsDto
{
    public bool IsEnabled { get; set; }
    public bool RequireCamera { get; set; } = true;
    public bool RequireMicrophone { get; set; }
    public bool RecordVideo { get; set; } = true;
    public bool TakeSnapshots { get; set; } = true;
    public string SnapshotMode { get; set; } = "fixed";
    public int SnapshotFixedSeconds { get; set; } = 30;
    public int SnapshotMinSeconds { get; set; } = 15;
    public int SnapshotMaxSeconds { get; set; } = 45;
    public bool BlockCopyPaste { get; set; } = true;
    public bool BlockTabSwitch { get; set; } = true;
    public bool BlockRightClick { get; set; } = true;
    public bool WarnOnRefreshAttempt { get; set; } = true;
    public bool ShowWarningsToStudent { get; set; } = true;
    public int? MaxViolationsBeforeAutoSubmit { get; set; }
}

public class AssessmentProctoringMapItem
{
    public int AssessmentId { get; set; }
    public string Label { get; set; } = string.Empty; // "Course Final", "Module: X", "Chapter: Y"
    public bool IsEnabled { get; set; }
}

public class CourseProctoringOverviewDto
{
    public ProctoringSettingsDto DefaultSettings { get; set; } = new();
    public List<AssessmentProctoringMapItem> Assessments { get; set; } = new();
}

public class UpdateCourseProctoringRequest
{
    public ProctoringSettingsDto Settings { get; set; } = new();
    public List<int> EnabledAssessmentIds { get; set; } = new();
}

public class ProctoringEventLogRequest
{
    public string EventType { get; set; } = string.Empty;
    public string? Detail { get; set; }
}

public class ProctoringEventDto
{
    public int Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string? FilePath { get; set; }
    public string? Detail { get; set; }
    public DateTime OccurredAt { get; set; }
}