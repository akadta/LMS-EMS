using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using dotnet.LmsApi.Dtos;

namespace dotnet.Shared.Services;

public interface IAiCourseStructureService
{
    Task<GeneratedCourseStructureDto> GenerateFullCourseAsync(AiStructureGenOptions options);
    Task<List<GeneratedModuleDto>> GenerateModulesAsync(string courseName, string? courseDescription, AiStructureGenOptions options);
    Task<List<GeneratedChapterDto>> GenerateChaptersAsync(string moduleName, string? moduleDescription, AiStructureGenOptions options);
}

public class GroqCourseStructureService : IAiCourseStructureService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private static readonly Random Rng = new();

    public GroqCourseStructureService(IHttpClientFactory httpFactory, IConfiguration config)
    {
        _httpFactory = httpFactory;
        _config = config;
    }

    private int ResolveCount(CountSetting c) =>
        c.Mode == "fixed" ? c.Fixed : Rng.Next(c.Min, c.Max + 1);

    public async Task<GeneratedCourseStructureDto> GenerateFullCourseAsync(AiStructureGenOptions options)
    {
        var moduleCount = ResolveCount(options.ModuleCount);
        var chapterCount = ResolveCount(options.ChapterCount);

        var prompt = $@"You are a professional course curriculum designer. Design a complete course structure on the topic: ""{options.Topic}"".

Requirements:
- Exactly {moduleCount} modules, in logical learning order (foundational to advanced).
- Each module must have exactly {chapterCount} chapters, in logical order within that module.
- Difficulty level: {options.Difficulty}.
- Each module and chapter needs a clear, specific name (not generic like ""Module 1"") and a 1-2 sentence description of what it covers.
- Content must be accurate and directly relevant to the topic — no filler.

Return ONLY valid JSON, no markdown, no commentary, in this exact shape:
{{
  ""name"": ""course name"",
  ""description"": ""course description"",
  ""modules"": [
    {{
      ""name"": ""module name"",
      ""description"": ""module description"",
      ""chapters"": [
        {{ ""name"": ""chapter name"", ""description"": ""chapter description"" }}
      ]
    }}
  ]
}}";

        var raw = await CallGroq(prompt);
        var parsed = JsonSerializer.Deserialize<RawCourseStructure>(raw, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? new RawCourseStructure();

        var result = new GeneratedCourseStructureDto
        {
            Name = parsed.Name,
            Description = parsed.Description,
            DifficultyLevel = options.Difficulty,
            HasFinalAssessment = ResolveFinalAssessment(options.CourseFinalAssessment)
        };

        foreach (var m in parsed.Modules)
        {
            var moduleDto = new GeneratedModuleDto
            {
                Name = m.Name,
                Description = m.Description,
                HasFinalAssessment = ResolveFinalAssessment(options.ModuleFinalAssessment)
            };
            foreach (var c in m.Chapters)
            {
                moduleDto.Chapters.Add(new GeneratedChapterDto
                {
                    Name = c.Name,
                    Description = c.Description,
                    HasFinalAssessment = ResolveFinalAssessment(options.ChapterFinalAssessment)
                });
            }
            result.Modules.Add(moduleDto);
        }

        return result;
    }

    public async Task<List<GeneratedModuleDto>> GenerateModulesAsync(string courseName, string? courseDescription, AiStructureGenOptions options)
    {
        var moduleCount = ResolveCount(options.ModuleCount);
        var chapterCount = ResolveCount(options.ChapterCount);

        var prompt = $@"You are a professional course curriculum designer. The course is: ""{courseName}"" — {courseDescription ?? "no description provided"}.

Generate exactly {moduleCount} NEW modules that logically extend this course, difficulty level {options.Difficulty}. Each module needs exactly {chapterCount} chapters. Each module/chapter needs a specific name and 1-2 sentence description.

Return ONLY valid JSON:
{{
  ""modules"": [
    {{ ""name"": ""string"", ""description"": ""string"", ""chapters"": [{{ ""name"": ""string"", ""description"": ""string"" }}] }}
  ]
}}";

        var raw = await CallGroq(prompt);
        var parsed = JsonSerializer.Deserialize<RawModulesWrapper>(raw, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? new RawModulesWrapper();

        var result = new List<GeneratedModuleDto>();
        foreach (var m in parsed.Modules)
        {
            var moduleDto = new GeneratedModuleDto { Name = m.Name, Description = m.Description, HasFinalAssessment = ResolveFinalAssessment(options.ModuleFinalAssessment) };
            foreach (var c in m.Chapters)
                moduleDto.Chapters.Add(new GeneratedChapterDto { Name = c.Name, Description = c.Description, HasFinalAssessment = ResolveFinalAssessment(options.ChapterFinalAssessment) });
            result.Add(moduleDto);
        }
        return result;
    }

    public async Task<List<GeneratedChapterDto>> GenerateChaptersAsync(string moduleName, string? moduleDescription, AiStructureGenOptions options)
    {
        var chapterCount = ResolveCount(options.ChapterCount);

        var prompt = $@"You are a course curriculum designer. The module is: ""{moduleName}"" — {moduleDescription ?? "no description provided"}.

Generate exactly {chapterCount} NEW chapters for this module, difficulty level {options.Difficulty}, in logical order. Each needs a specific name and 1-2 sentence description.

Return ONLY valid JSON:
{{ ""chapters"": [{{ ""name"": ""string"", ""description"": ""string"" }}] }}";

        var raw = await CallGroq(prompt);
        var parsed = JsonSerializer.Deserialize<RawChaptersWrapper>(raw, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? new RawChaptersWrapper();

        return parsed.Chapters.Select(c => new GeneratedChapterDto
        {
            Name = c.Name,
            Description = c.Description,
            HasFinalAssessment = ResolveFinalAssessment(options.ChapterFinalAssessment)
        }).ToList();
    }

    private bool ResolveFinalAssessment(FinalAssessmentSetting setting) => setting.Mode switch
    {
        "yes" => true,
        "no" => false,
        "random" => Rng.Next(2) == 1,
        _ => false
    };

    private async Task<string> CallGroq(string prompt)
    {
        var apiKey = _config["Groq:ApiKey"];
        var model = _config["Groq:Model"] ?? "llama-3.3-70b-versatile";

        var client = _httpFactory.CreateClient("groq");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

        var body = new
        {
            model,
            messages = new[] { new { role = "system", content = prompt }, new { role = "user", content = "Generate now." } },
            temperature = 0.5,
            response_format = new { type = "json_object" }
        };

        var content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        var response = await client.PostAsync("chat/completions", content);
        response.EnsureSuccessStatusCode();

        var raw = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(raw);
        return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? "{}";
    }

    private class RawChapter { public string Name { get; set; } = ""; public string Description { get; set; } = ""; }
    private class RawModule { public string Name { get; set; } = ""; public string Description { get; set; } = ""; public List<RawChapter> Chapters { get; set; } = new(); }
    private class RawCourseStructure { public string Name { get; set; } = ""; public string Description { get; set; } = ""; public List<RawModule> Modules { get; set; } = new(); }
    private class RawModulesWrapper { public List<RawModule> Modules { get; set; } = new(); }
    private class RawChaptersWrapper { public List<RawChapter> Chapters { get; set; } = new(); }
}