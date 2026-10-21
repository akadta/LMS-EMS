using Microsoft.AspNetCore.Http;

namespace dotnet.UserAdminApi.Dtos.Departments;

public class DepartmentCreateForm
{
    public string Name { get; set; } = string.Empty;
    public string AdminName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Place { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
    public int? CompanyId { get; set; } // required for organization callers; ignored for company callers
    public IFormFile? Logo { get; set; }
}