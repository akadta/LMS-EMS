using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("course_category_maps")]
public class CourseCategoryMap
{
    [Column("id")] public int Id { get; set; }
    [Column("course_id")] public int CourseId { get; set; }
    [ForeignKey("CourseId")] public Course? Course { get; set; }
    [Column("course_category_id")] public int CourseCategoryId { get; set; }
    [ForeignKey("CourseCategoryId")] public CourseCategory? CourseCategory { get; set; }
}