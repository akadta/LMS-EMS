using dotnet.Data;
using dotnet.Models;
using Microsoft.EntityFrameworkCore;

namespace dotnet.Seeders;

public static class SystemRoleSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await EnsureSystemRole(context, "Central", "central");
        await EnsureSystemRole(context, "Organization", "organization");
        await EnsureSystemRole(context, "Company", "company");
        await EnsureSystemRole(context, "Department", "department");
        await EnsureSystemRole(context, "Student", "student");
        await EnsureSystemRole(context, "Faculty", "faculty");
    }

    private static async Task EnsureSystemRole(AppDbContext context, string name, string slug)
    {
        var exists = await context.SystemRoles.AnyAsync(sr => sr.Slug == slug);
        if (!exists)
        {
            context.SystemRoles.Add(new SystemRole { Name = name, Slug = slug, IsActive = true });
            await context.SaveChangesAsync();
        }
    }
}