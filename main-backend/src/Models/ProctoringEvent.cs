using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("proctoring_events")]
public class ProctoringEvent
{
    [Column("id")] public int Id { get; set; }
    [Column("attempt_id")] public int AttemptId { get; set; }
    [ForeignKey("AttemptId")] public AssessmentAttempt? Attempt { get; set; }

    // snapshot | video_clip | tab_switch | window_blur | copy | paste | right_click | refresh_attempt | camera_disabled | mic_disabled
    [Column("event_type")] public string EventType { get; set; } = string.Empty;
    [Column("file_path")] public string? FilePath { get; set; } // for snapshot/video_clip
    [Column("detail")] public string? Detail { get; set; }
    [Column("occurred_at")] public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}