namespace dotnet.LmsApi.Dtos;

public class ChapterMediaDto
{
    public int Id { get; set; }
    public string MediaType { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Caption { get; set; }
}

public class ChapterListItemDto
{
    public int Id { get; set; }
    public int ModuleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsFinalAssessment { get; set; }
    public bool IsDraft { get; set; }
    public int MediaCount { get; set; }
    public string? ThumbnailUrl { get; set; }
}

public class ChapterDetailDto
{
    public int Id { get; set; }
    public int ModuleId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsFinalAssessment { get; set; }
    public bool IsDraft { get; set; }
    public List<ChapterMediaDto> Media { get; set; } = new();

    public bool IsPass { get; set; }
    public bool IsReviewUnlock { get; set; }
}

public class ChapterGatingRequest
{
    public bool IsPass { get; set; }
    public bool IsReviewUnlock { get; set; }
}