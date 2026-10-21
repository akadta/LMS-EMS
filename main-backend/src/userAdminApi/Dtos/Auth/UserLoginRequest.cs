namespace dotnet.UserAdminApi.Dtos;

public class UserLoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class UserLoginResponse
{
    public string Token { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string SystemRoleSlug { get; set; } = string.Empty;
    public string RoleSlug { get; set; } = string.Empty;
}