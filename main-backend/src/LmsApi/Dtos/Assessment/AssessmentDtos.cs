namespace dotnet.LmsApi.Dtos;

public class AssessmentSettingsRequest
{
    public string? EntityType { get; set; } // course | module | chapter
    public int? EntityId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Mode { get; set; } = "instant";
    public bool IsTimer { get; set; }
    public string? TimerScope { get; set; }
    public int? TimerValue { get; set; }
    public string? TimerUnit { get; set; }
    public string QuestionFormat { get; set; } = "numeric";
    public string OptionFormat { get; set; } = "alpha_lower";
}

public class AssessmentDto
{
    public int Id { get; set; }
    public string? EntityType { get; set; }
    public int? EntityId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Mode { get; set; } = string.Empty;
    public bool IsTimer { get; set; }
    public string? TimerScope { get; set; }
    public int? TimerValue { get; set; }
    public string? TimerUnit { get; set; }
    public string QuestionFormat { get; set; } = string.Empty;
    public string OptionFormat { get; set; } = string.Empty;
    public bool IsShuffle { get; set; }
    public double? PassPercentage { get; set; }
    public int? QuestionsToShow { get; set; }
    public bool IsPublished { get; set; }
    public bool IsActive { get; set; }
    public int QuestionCount { get; set; }
    public List<AssessmentGradeDto> Grades { get; set; } = new();
}

public class AssessmentGradeDto
{
    public int Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public double MinPercentage { get; set; }
    public double MaxPercentage { get; set; }
}

public class AssessmentGradeRequest
{
    public string Label { get; set; } = string.Empty;
    public double MinPercentage { get; set; }
    public double MaxPercentage { get; set; }
}

public class PublishAssessmentRequest
{
    public double PassPercentage { get; set; }
    public bool IsShuffle { get; set; }
    public int? QuestionsToShow { get; set; }
    public List<AssessmentGradeRequest> Grades { get; set; } = new();
}

public class SwitchModeRequest
{
    public string Mode { get; set; } = "instant";
    public bool KeepCompatible { get; set; }
}

public class AssessmentOptionDto
{
    public int Id { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public double? Mark { get; set; }
}

public class AssessmentOptionRequest
{
    public int? Id { get; set; }
    public string OptionText { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public double? Mark { get; set; }
}

public class AssessmentQuestionMediaDto
{
    public int Id { get; set; }
    public string MediaType { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

public class AssessmentQuestionDto
{
    public int Id { get; set; }
    public int AssessmentId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public string MarkingMode { get; set; } = string.Empty;
    public double? Mark { get; set; }
    public int SortOrder { get; set; }
    public List<AssessmentOptionDto> Options { get; set; } = new();
    public List<AssessmentQuestionMediaDto> Media { get; set; } = new();
}

public class QuestionFormRequest
{
    public int AssessmentId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string QuestionType { get; set; } = "mcq_single";
    public string MarkingMode { get; set; } = "per_question";
    public double? Mark { get; set; }
    public string? OptionsJson { get; set; }
    public List<IFormFile>? Images { get; set; }
    public List<IFormFile>? Videos { get; set; }
    public List<IFormFile>? Documents { get; set; }
    public List<int>? KeepMediaIds { get; set; }
}