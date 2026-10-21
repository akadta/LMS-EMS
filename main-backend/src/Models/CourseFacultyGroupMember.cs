using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("course_faculty_group_members")]
public class CourseFacultyGroupMember
{
    [Column("id")] public int Id { get; set; }
    [Column("group_id")] public int GroupId { get; set; }
    [ForeignKey("GroupId")] public CourseFacultyGroup? Group { get; set; }

    [Column("faculty_id")] public int FacultyId { get; set; }
    [ForeignKey("FacultyId")] public Faculty? Faculty { get; set; }
}