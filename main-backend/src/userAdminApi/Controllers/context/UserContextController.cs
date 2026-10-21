using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using dotnet.Shared.Controllers;
using dotnet.Data;

namespace dotnet.UserAdminApi.Controllers;

[Authorize]
[Route("api/user/context")]
public class UserContextController : BaseController
{
    private readonly AppDbContext _context;

    public UserContextController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetContext()
    {
        var roleSlug = CurrentSystemRoleSlug?.ToLower();

        int organizationId;
        string? entityName = null;
        string? entityLogoPath = null;

        if (roleSlug == "organization")
        {
            var org = await _context.Organizations.FirstOrDefaultAsync(o => o.UserId == CurrentUserId);
            if (org == null)
                return NotFound(new { success = false, errors = new[] { "Organization not found." } });

            organizationId = org.Id;
            entityName = org.Name;
            entityLogoPath = org.LogoPath;
        }
        else if (roleSlug == "company")
        {
            var company = await _context.Companies.FirstOrDefaultAsync(c => c.UserId == CurrentUserId);
            if (company == null)
                return NotFound(new { success = false, errors = new[] { "Company not found." } });

            organizationId = company.OrganizationId;
            entityName = company.Name;
            entityLogoPath = company.LogoPath;
        }
        else if (roleSlug == "department")
        {
            var department = await _context.Departments.FirstOrDefaultAsync(d => d.UserId == CurrentUserId);
            if (department == null)
                return NotFound(new { success = false, errors = new[] { "Department not found." } });

            organizationId = department.OrganizationId;
            entityName = department.Name;
            entityLogoPath = department.LogoPath;
        }
        else if (roleSlug == "student")
        {
            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == CurrentUserId);
            if (student == null)
                return NotFound(new { success = false, errors = new[] { "Student not found." } });

            organizationId = student.OrganizationId;
            entityName = student.Name;
            entityLogoPath = student.PhotoPath;
        }
        else if (roleSlug == "faculty")
        {
            var faculty = await _context.Faculties.FirstOrDefaultAsync(f => f.UserId == CurrentUserId);
            if (faculty == null)
                return NotFound(new { success = false, errors = new[] { "Faculty not found." } });

            organizationId = faculty.OrganizationId;
            entityName = faculty.Name;
            entityLogoPath = faculty.PhotoPath;
        }
        else
        {
            return Unauthorized(new { success = false, errors = new[] { "Not authorized for this portal." } });
        }

        var org2 = await _context.Organizations.FirstOrDefaultAsync(o => o.Id == organizationId);
        if (org2 == null)
            return NotFound(new { success = false, errors = new[] { "Organization not found." } });

        return Ok(new
        {
            success = true,
            data = new
            {
                role = roleSlug,
                entityName,
                organizationName = org2.Name,
                logoUrl = string.IsNullOrEmpty(entityLogoPath)
                    ? (string.IsNullOrEmpty(org2.LogoPath) ? null : $"/storage/{org2.LogoPath}")
                    : $"/storage/{entityLogoPath}",
                themeColor = org2.ThemeColor,
                sidebarColor = org2.SidebarColor,
                headerColor = org2.HeaderColor,
                isLms = org2.IsLms,
                isEms = org2.IsEms
            }
        });
    }
}