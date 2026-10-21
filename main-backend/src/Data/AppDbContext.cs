using dotnet.Models;
using Microsoft.EntityFrameworkCore;

namespace dotnet.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
    : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Role> Roles { get; set; }
    public DbSet<SystemRole> SystemRoles { get; set; }

    public DbSet<Organization> Organizations { get; set; }
    public DbSet<OrganizationAddress> OrganizationAddresses { get; set; }
    public DbSet<OrganizationCategory> OrganizationCategories { get; set; }
    public DbSet<OrganizationCategoryMap> OrganizationCategoryMaps { get; set; }

    public DbSet<Company> Companies { get; set; }

    public DbSet<Department> Departments { get; set; }

    public DbSet<Course> Courses { get; set; }
    public DbSet<CourseImage> CourseImages { get; set; }
    public DbSet<CourseCategory> CourseCategories { get; set; }
    public DbSet<CourseCategoryMap> CourseCategoryMaps { get; set; }
    public DbSet<CourseModule> Modules { get; set; }
    public DbSet<Chapter> Chapters { get; set; }
    public DbSet<ChapterMedia> ChapterMedia { get; set; }

    public DbSet<Assessment> Assessments { get; set; }
    public DbSet<AssessmentGrade> AssessmentGrades { get; set; }
    public DbSet<AssessmentQuestion> AssessmentQuestions { get; set; }
    public DbSet<AssessmentOption> AssessmentOptions { get; set; }
    public DbSet<AssessmentQuestionMedia> AssessmentQuestionMedia { get; set; }

    public DbSet<Student> Students { get; set; } = null!;

    public DbSet<SystemSubRole> SystemSubRoles { get; set; } = null!;
    public DbSet<Faculty> Faculties { get; set; } = null!;

    public DbSet<CourseFacultyGroup> CourseFacultyGroups { get; set; }
    public DbSet<CourseFacultyGroupMember> CourseFacultyGroupMembers { get; set; }

    public DbSet<Batch> Batches { get; set; }
    public DbSet<BatchStudent> BatchStudents { get; set; }
    public DbSet<BatchCourse> BatchCourses { get; set; }
    public DbSet<BatchCourseStudent> BatchCourseStudents { get; set; }

    public DbSet<StudentCourseEnrollment> StudentCourseEnrollments { get; set; }
    public DbSet<StudentChapterProgress> StudentChapterProgress { get; set; }
    public DbSet<StudentModuleProgress> StudentModuleProgress { get; set; }
    public DbSet<AssessmentAttempt> AssessmentAttempts { get; set; }
    public DbSet<AssessmentAttemptAnswer> AssessmentAttemptAnswers { get; set; }

public DbSet<ProctoringSettings> ProctoringSettings { get; set; }
public DbSet<ProctoringEvent> ProctoringEvents { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Organization>()
            .HasIndex(o => o.Name);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email);

        modelBuilder.Entity<OrganizationCategoryMap>()
            .HasIndex(m => new { m.OrganizationId, m.OrganizationCategoryId })
            .IsUnique();

        modelBuilder.Entity<CourseCategory>()
            .HasIndex(c => new { c.OrganizationId, c.Name })
            .IsUnique();

        modelBuilder.Entity<CourseCategoryMap>()
            .HasIndex(m => new { m.CourseId, m.CourseCategoryId })
            .IsUnique();

        modelBuilder.Entity<BatchStudent>()
            .HasIndex(bs => new { bs.BatchId, bs.StudentId })
            .IsUnique();

        modelBuilder.Entity<BatchCourse>()
            .HasIndex(bc => new { bc.BatchId, bc.CourseId })
            .IsUnique();

        modelBuilder.Entity<BatchCourseStudent>()
            .HasIndex(bcs => new { bcs.BatchCourseId, bcs.StudentId })
            .IsUnique();
        modelBuilder.Entity<StudentCourseEnrollment>().HasIndex(e => new { e.StudentId, e.BatchCourseId }).IsUnique();
        modelBuilder.Entity<StudentChapterProgress>().HasIndex(p => new { p.StudentId, p.ChapterId }).IsUnique();
        modelBuilder.Entity<StudentModuleProgress>().HasIndex(p => new { p.StudentId, p.ModuleId }).IsUnique();
        modelBuilder.Entity<ProctoringSettings>().HasIndex(p => p.AssessmentId).IsUnique();
    }
}