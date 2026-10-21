using Microsoft.AspNetCore.Http;

namespace dotnet.UserAdminApi.Dtos.Companies;

public class CompanyListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AdminName { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? Place { get; set; }
    public bool IsActive { get; set; }
    public int DepartmentCount { get; set; }
}

public class CompanyUpdateForm
{
    public string Name { get; set; } = string.Empty;
    public string AdminName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? Place { get; set; }
    public IFormFile? Logo { get; set; }
}