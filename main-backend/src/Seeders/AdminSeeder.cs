using dotnet.Data;
using dotnet.Models;
using Microsoft.EntityFrameworkCore;

namespace dotnet.Seeders;

public static class AdminSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        var role = await context.Roles
            .FirstOrDefaultAsync(r => r.Slug == "super-admin");

        if (role == null)
        {
            role = new Role
            {
                Name = "Super Admin",
                Slug = "super-admin",
                IsActive = true
            };

            context.Roles.Add(role);
            await context.SaveChangesAsync();
        }

        var systemRole = await context.SystemRoles
            .FirstOrDefaultAsync(sr => sr.Slug == "central");

        var admin = await context.Users
            .FirstOrDefaultAsync(u => u.Email == "lmsproxerpadmin@gmail.com");

        if (admin == null)
        {
            context.Users.Add(new User
            {
                Name = "Super Admin",
                Email = "lmsproxerpadmin@gmail.com",
                Password = BCrypt.Net.BCrypt.HashPassword("LmsProxerpAdmin@2026"),
                RoleId = role.Id,
                SystemRoleId = systemRole?.Id,
                IsActive = true
            });

            await context.SaveChangesAsync();
        }
        else if (admin.SystemRoleId == null && systemRole != null)
        {
            admin.SystemRoleId = systemRole.Id;
            await context.SaveChangesAsync();
        }
    }
}