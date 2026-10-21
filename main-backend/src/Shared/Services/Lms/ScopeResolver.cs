using Microsoft.EntityFrameworkCore;
using dotnet.Data;
using dotnet.Models;

namespace dotnet.Shared.Services;

public class CourseScope
{
    public int OrganizationId { get; set; }
    public int? CompanyId { get; set; }
    public int? DepartmentId { get; set; }
}

public static class ScopeResolver
{
    public static async Task<CourseScope?> ResolveAsync(AppDbContext context, string? roleSlug, int? userId)
    {
        if (userId == null) return null;
        var uid = userId.Value;

        roleSlug = roleSlug?.ToLower();

        if (roleSlug == "organization")
        {
            var org = await context.Organizations.FirstOrDefaultAsync(o => o.UserId == uid);
            return org == null ? null : new CourseScope { OrganizationId = org.Id };
        }
        if (roleSlug == "company")
        {
            var company = await context.Companies.FirstOrDefaultAsync(c => c.UserId == uid);
            return company == null ? null : new CourseScope { OrganizationId = company.OrganizationId, CompanyId = company.Id };
        }
        if (roleSlug == "department")
        {
            var dept = await context.Departments.FirstOrDefaultAsync(d => d.UserId == uid);
            return dept == null ? null : new CourseScope { OrganizationId = dept.OrganizationId, CompanyId = dept.CompanyId, DepartmentId = dept.Id };
        }
        return null;
    }

    // Scope filter used on list queries: org sees all, company sees own+depts under it, department sees only itself
    public static IQueryable<Course> ApplyCourseScope(IQueryable<Course> query, CourseScope scope)
    {
        if (scope.DepartmentId != null)
            return query.Where(c => c.OrganizationId == scope.OrganizationId && c.DepartmentId == scope.DepartmentId);
        if (scope.CompanyId != null)
            return query.Where(c => c.OrganizationId == scope.OrganizationId && c.CompanyId == scope.CompanyId);
        return query.Where(c => c.OrganizationId == scope.OrganizationId);
    }
}