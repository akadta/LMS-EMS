using Microsoft.AspNetCore.Http;

namespace dotnet.UserAdminApi.Dtos.Faculty;

public class FacultyCreateForm
{
    public string Name { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public int? CompanyId { get; set; }
    public int? DepartmentId { get; set; }
    public int SubRoleId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
    public IFormFile? Photo { get; set; }
}

public class FacultyUpdateForm
{
    public string Name { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public int? CompanyId { get; set; }
    public int? DepartmentId { get; set; }
    public int SubRoleId { get; set; }
    public IFormFile? Photo { get; set; }
}