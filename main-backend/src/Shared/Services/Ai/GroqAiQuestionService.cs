using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using dotnet.LmsApi.Dtos;

namespace dotnet.Shared.Services;

public interface IAiQuestionService
{
    Task<List<AiGeneratedQuestion>> GenerateAsync(string contextTitle, string? contextDescription, string? difficultyLevel, AiGenerateRequest req);
}

public class GroqAiQuestionService : IAiQuestionService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;

    public GroqAiQuestionService(IHttpClientFactory httpFactory, IConfiguration config)
    {
        _httpFactory = httpFactory;
        _config = config;
    }

   public async Task<List<AiGeneratedQuestion>> GenerateAsync(string contextTitle, string? contextDescription, string? difficultyLevel, AiGenerateRequest req)
{
        var apiKey = _config["Groq:ApiKey"];
        var model = _config["Groq:Model"] ?? "llama-3.3-70b-versatile";

       var typeInstruction = req.TypeMode switch
{
    "single" => "Every question must be QuestionType = \"mcq_single\" (exactly one correct option). Options array required.",
    "multiple" => "Every question must be QuestionType = \"mcq_multi\" (2 or more correct options). Options array required.",
    "short" => "Every question must be QuestionType = \"short_answer\". These expect a brief 1-2 sentence written answer. Do NOT generate an Options array (leave it empty []).",
    "long" => "Every question must be QuestionType = \"long_answer\". These expect a detailed, multi-paragraph written answer. Do NOT generate an Options array (leave it empty []).",
    "mixed_mcq" => "Mix QuestionType between \"mcq_single\" and \"mcq_multi\" naturally based on what fits the content. Options array required for all.",
    "mixed_all" => "Mix QuestionType across \"mcq_single\", \"mcq_multi\", \"short_answer\", and \"long_answer\" naturally. For short_answer/long_answer, leave Options as an empty array [].",
    "mixed_written" => "Mix QuestionType between \"short_answer\" and \"long_answer\" only — no MCQ types. Leave Options as an empty array [] for all.",
    _ => "Mix QuestionType between \"mcq_single\" and \"mcq_multi\" naturally based on what fits the content."
};
        var markInstruction = req.MarksMode == "fixed"
            ? $"Every question's total Mark must be exactly {req.FixedMark}."
            : $"Vary each question's total Mark randomly between {req.MinMark} and {req.MaxMark} (use realistic values like 1, 1.5, 2, 2.5).";

      var correctCountInstruction = req.CorrectCountMode == "fixed"
    ? $"Every mcq_multi question must have exactly {req.FixedCorrectCount} correct options."
    : $"Every mcq_multi question must have a random number of correct options between {req.MinCorrectCount} and {req.MaxCorrectCount} (inclusive), varied naturally per question — do not use the same count every time.";

var optionMarkDistInstruction = req.OptionMarkDistribution == "same"
    ? $"Do NOT divide the mark across options. Every correct option in the question must independently carry the FULL mark value described above (e.g. if the mark is {(req.MarksMode == "fixed" ? req.FixedMark.ToString() : $"{req.MinMark}-{req.MaxMark}")}, and there are 2 correct options, both options get that same full value — not half each)."
    : $"Each correct option gets its own independently randomized Mark value between {req.MinMark} and {req.MaxMark}, varied per option (they do NOT need to sum to any total and do NOT need to match the marksMode described above).";
var multiMarkInstruction = req.MultiMarkingMode == "per_option"
    ? $"For any mcq_multi question, set MarkingMode = \"per_option\". {optionMarkDistInstruction} Incorrect options get Mark = null."
    : "For any mcq_multi question, set MarkingMode = \"per_question\" and put the total Mark on the question itself (option Mark = null). The student must select exactly all correct options to get credit.";

        var focus = string.IsNullOrWhiteSpace(req.FocusNote) ? "" : $"\nAdditional focus: {req.FocusNote}";
var difficultyInstruction = string.IsNullOrWhiteSpace(difficultyLevel)
    ? "Assume an intermediate difficulty level since none is specified."
    : $"Calibrate difficulty precisely to a \"{difficultyLevel}\" level learner — {DifficultyGuidance(difficultyLevel)}";

var systemPrompt = $@"You are an exam question generator. You must generate questions STRICTLY based on the given topic context below. Do not invent facts outside general well-established knowledge of this exact topic. Do not reference the context text itself (e.g. don't say 'as mentioned above').

Topic: {contextTitle}
Description: {contextDescription ?? "no description provided"}
Difficulty: {difficultyInstruction}
{focus}

Rules:
- Generate exactly {req.Count} questions.
- {typeInstruction}
- {markInstruction}
- {multiMarkInstruction}
- Every mcq_single question needs 2-5 options, exactly 1 marked IsCorrect = true. The correct option's position must vary randomly across questions — do not always place it as the first option.
- Every mcq_multi question needs 4-7 total options (so there's always at least 1 wrong option remaining). {correctCountInstruction}
- CRITICAL: For every question, independently randomize where the correct option(s) sit among the full options list. All positions must be equally likely across the whole question set — do not default to early positions and do not repeat the same position pattern across questions.- When MarkingMode = ""per_option"": the question's effective total possible mark is the SUM of its correct options' marks — this is expected to be higher than a single-option mark when multiple correct options exist. Do not artificially cap or divide it.
- Every short_answer or long_answer question must have MarkingMode = ""per_question"", Options = [], and no IsCorrect field usage.
- Questions must be unambiguous, factually accurate, and directly relevant to the topic above.

Return ONLY valid JSON, no markdown, no commentary, in this exact shape:
{{
  ""questions"": [
    {{
      ""questionText"": ""string"",
      ""questionType"": ""mcq_single"" | ""mcq_multi"",
      ""markingMode"": ""per_question"" | ""per_option"",
      ""mark"": number or null,
      ""options"": [
        {{ ""optionText"": ""string"", ""isCorrect"": bool, ""mark"": number or null }}
      ]
    }}
  ]
}}";

        var client = _httpFactory.CreateClient("groq");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var body = new
        {
            model,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = "Generate the questions now." }
            },
            temperature = 0.4,
            response_format = new { type = "json_object" }
        };

        var content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        var response = await client.PostAsync("chat/completions", content);
        response.EnsureSuccessStatusCode();

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        var messageContent = doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

        var parsed = JsonSerializer.Deserialize<AiQuestionWrapper>(messageContent!, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        return parsed?.Questions ?? new List<AiGeneratedQuestion>();
    }

    private class AiQuestionWrapper
    {
        public List<AiGeneratedQuestion> Questions { get; set; } = new();
    }

    private static string DifficultyGuidance(string level) => level.ToLower() switch
{
    "beginner" => "use simple, direct wording, test recall of basic definitions and core concepts, avoid tricky edge cases.",
    "intermediate" => "test applied understanding, require connecting 2 related concepts, moderate wording complexity.",
    "advanced" => "test deeper analysis, edge cases, and scenario-based reasoning, expect the learner to already know the basics.",
    "expert" => "test nuanced, expert-level distinctions, subtle edge cases, and scenario judgment calls that require mastery, not just familiarity.",
    _ => "use moderate, intermediate-level difficulty."
};
}