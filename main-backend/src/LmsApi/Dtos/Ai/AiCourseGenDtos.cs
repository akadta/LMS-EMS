namespace dotnet.LmsApi.Dtos;

public class CountSetting
{
    public string Mode { get; set; } = "fixed";
    public int Fixed { get; set; } = 3;
    public int Min { get; set; } = 2;
    public int Max { get; set; } = 5;
}

public class FinalAssessmentSetting
{
    public string Mode { get; set; } = "no";
}

public class AiStructureGenOptions
{
    public CountSetting ModuleCount { get; set; } = new();
    public CountSetting ChapterCount { get; set; } = new();
    public string DifficultyMode { get; set; } = "fixed";
    public string Difficulty { get; set; } = "beginner";
    public bool IncludeImages { get; set; } = true;
    public string DraftMode { get; set; } = "fixed";
    public bool IsDraft { get; set; } = true;
    public FinalAssessmentSetting CourseFinalAssessment { get; set; } = new();
    public FinalAssessmentSetting ModuleFinalAssessment { get; set; } = new();
    public FinalAssessmentSetting ChapterFinalAssessment { get; set; } = new();
    public bool GenerateQuestions { get; set; } = false;
    public string? Topic { get; set; }
}

public class GeneratedChapterDto
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public bool HasFinalAssessment { get; set; }
}

public class GeneratedModuleDto
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public bool HasFinalAssessment { get; set; }
    public List<GeneratedChapterDto> Chapters { get; set; } = new();
}

public class GeneratedCourseStructureDto
{
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string DifficultyLevel { get; set; } = "beginner";
    public bool HasFinalAssessment { get; set; }
    public List<GeneratedModuleDto> Modules { get; set; } = new();
}

public class AiCreateCompleteCourseRequest
{
    public AiStructureGenOptions Options { get; set; } = new();
}

public class AiAddModulesRequest
{
    public int CourseId { get; set; }
    public AiStructureGenOptions Options { get; set; } = new();
}

public class AiAddChaptersRequest
{
    public int ModuleId { get; set; }
    public AiStructureGenOptions Options { get; set; } = new();
}