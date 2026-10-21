namespace dotnet.CentralAdminApi.Dtos;

public class CategoryRequest
{
    public string Name { get; set; } = string.Empty;
}

public class CategoryResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}