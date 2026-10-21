namespace dotnet.LmsApi.Dtos;

public class AiGenerateRequest
{
    public int AssessmentId { get; set; }
    public int Count { get; set; } = 5;
    public string TypeMode { get; set; } = "single"; // single | multiple | mixed
    public string MultiMarkingMode { get; set; } = "per_option";
public string MarksMode { get; set; } = "fixed";
public double FixedMark { get; set; } = 1;
public double MinMark { get; set; } = 1;
public double MaxMark { get; set; } = 2;

// Multiple Correct — how many correct answers per question
public string CorrectCountMode { get; set; } = "fixed"; // fixed | random
public int FixedCorrectCount { get; set; } = 2;
public int MinCorrectCount { get; set; } = 1;
public int MaxCorrectCount { get; set; } = 3;

// Multiple Correct + per_option — how marks split across correct options
public string OptionMarkDistribution { get; set; } = "same"; // same | random

public string? FocusNote { get; set; }
}

public class AiGeneratedOption
{
    public string OptionText { get; set; } = "";
    public bool IsCorrect { get; set; }
    public double? Mark { get; set; }
}

public class AiGeneratedQuestion
{
    public string QuestionText { get; set; } = "";
    public string QuestionType { get; set; } = "mcq_single";
    public string MarkingMode { get; set; } = "per_question";
    public double? Mark { get; set; }
    public List<AiGeneratedOption> Options { get; set; } = new();
}

public class AiCommitRequest
{
    public int AssessmentId { get; set; }
    public List<AiGeneratedQuestion> Questions { get; set; } = new();
}