using System.ComponentModel.DataAnnotations.Schema;

namespace dotnet.Models;

[Table("assessment_proctoring_settings")]
public class ProctoringSettings
{
    [Column("id")] public int Id { get; set; }
    [Column("assessment_id")] public int AssessmentId { get; set; }
    [ForeignKey("AssessmentId")] public Assessment? Assessment { get; set; }

    [Column("is_enabled")] public bool IsEnabled { get; set; }
    [Column("require_camera")] public bool RequireCamera { get; set; } = true;
    [Column("require_microphone")] public bool RequireMicrophone { get; set; } = false;

    [Column("record_video")] public bool RecordVideo { get; set; } = true;
    [Column("take_snapshots")] public bool TakeSnapshots { get; set; } = true;
    [Column("snapshot_mode")] public string SnapshotMode { get; set; } = "fixed"; // fixed | random
    [Column("snapshot_fixed_seconds")] public int SnapshotFixedSeconds { get; set; } = 30;
    [Column("snapshot_min_seconds")] public int SnapshotMinSeconds { get; set; } = 15;
    [Column("snapshot_max_seconds")] public int SnapshotMaxSeconds { get; set; } = 45;

    [Column("block_copy_paste")] public bool BlockCopyPaste { get; set; } = true;
    [Column("block_tab_switch")] public bool BlockTabSwitch { get; set; } = true;
    [Column("block_right_click")] public bool BlockRightClick { get; set; } = true;
    [Column("warn_on_refresh_attempt")] public bool WarnOnRefreshAttempt { get; set; } = true;

    [Column("show_warnings_to_student")] public bool ShowWarningsToStudent { get; set; } = true;
    [Column("max_violations_before_auto_submit")] public int? MaxViolationsBeforeAutoSubmit { get; set; }

    [Column("updated_at")] public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}