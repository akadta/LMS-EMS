namespace dotnet.LmsApi.Dtos;

public class CourseTreeDto
{
    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public bool IsDraft { get; set; }
    public bool HasFinalAssessment { get; set; }
    public int? AssessmentId { get; set; }
    public bool AssessmentIsDraft { get; set; }
    public bool AssessmentIsPublished { get; set; }
    public int AssessmentQuestionCount { get; set; }
    public List<ModuleTreeDto> Modules { get; set; } = new();
}

public class ModuleTreeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsDraft { get; set; }
    public bool HasFinalAssessment { get; set; }
    public int? AssessmentId { get; set; }
    public bool AssessmentIsDraft { get; set; }
    public bool AssessmentIsPublished { get; set; }
    public int AssessmentQuestionCount { get; set; }
    public List<ChapterTreeDto> Chapters { get; set; } = new();
}

public class ChapterTreeDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsDraft { get; set; }
    public bool HasFinalAssessment { get; set; }
    public int? AssessmentId { get; set; }
    public bool AssessmentIsDraft { get; set; }
    public bool AssessmentIsPublished { get; set; }
    public int AssessmentQuestionCount { get; set; }
}

public class PublishAllResultDto
{
    public int ModulesPublished { get; set; }
    public int ChaptersPublished { get; set; }
    public int AssessmentsPublished { get; set; }
}