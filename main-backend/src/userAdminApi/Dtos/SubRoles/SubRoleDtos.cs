namespace dotnet.UserAdminApi.Dtos.SubRoles;

public class SubRoleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DepartmentId { get; set; }
    public bool IsActive { get; set; }
}

public class SubRoleCreateForm
{
    public int? DepartmentId { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class SubRoleUpdateForm
{
    public string Name { get; set; } = string.Empty;
}