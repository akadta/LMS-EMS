using Microsoft.AspNetCore.Http;

namespace dotnet.UserAdminApi.Dtos.Departments;

public class DepartmentListItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AdminName { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? Place { get; set; }
    public int CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public bool IsActive { get; set; }
}

public class DepartmentUpdateForm
{
    public string Name { get; set; } = string.Empty;
    public string AdminName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? Place { get; set; }
    public IFormFile? Logo { get; set; }
}