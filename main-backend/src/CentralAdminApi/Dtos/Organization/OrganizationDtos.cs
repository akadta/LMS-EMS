namespace dotnet.CentralAdminApi.Dtos;

public class CreateOrganizationRequest
{
    public string Name { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? ThemeColor { get; set; }
    public string? SidebarColor { get; set; }
    public string? HeaderColor { get; set; }
    public bool IsLms { get; set; }
    public bool IsEms { get; set; }
    public List<int> CategoryIds { get; set; } = new();
    public List<string> Addresses { get; set; } = new();
    public IFormFile? Logo { get; set; }

    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class UpdateOrganizationRequest
{
    public string Name { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? ThemeColor { get; set; }
    public string? SidebarColor { get; set; }
    public string? HeaderColor { get; set; }
    public bool IsLms { get; set; }
    public bool IsEms { get; set; }
    public List<int> CategoryIds { get; set; } = new();
    public List<string> Addresses { get; set; } = new();
    public IFormFile? Logo { get; set; }
}

public class OrganizationListItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? LogoUrl { get; set; }
    public bool IsActive { get; set; }
    public bool IsLms { get; set; }
    public bool IsEms { get; set; }
    public List<string> Categories { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class OrganizationDetail
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? LogoUrl { get; set; }
    public string? ThemeColor { get; set; }
    public string? SidebarColor { get; set; }
    public string? HeaderColor { get; set; }
    public bool IsActive { get; set; }
    public bool IsLms { get; set; }
    public bool IsEms { get; set; }
    public List<string> Addresses { get; set; } = new();
    public List<int> CategoryIds { get; set; } = new();
    public List<string> Categories { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}