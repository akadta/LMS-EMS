using Microsoft.AspNetCore.Http;

namespace dotnet.CentralAdminApi.Dtos;

public class CreateDepartmentRequest
{
    public string Name { get; set; } = string.Empty;
    public string AdminName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Place { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
    public IFormFile? Logo { get; set; }
}

public class UpdateDepartmentRequest
{
    public string Name { get; set; } = string.Empty;
    public string AdminName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Place { get; set; } = string.Empty;
    public IFormFile? Logo { get; set; }
}

public class DepartmentListItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AdminName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Place { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DepartmentDetail
{
    public int Id { get; set; }
    public int OrganizationId { get; set; }
    public int CompanyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AdminName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? Place { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}