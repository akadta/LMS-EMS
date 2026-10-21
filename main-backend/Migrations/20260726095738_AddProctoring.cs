using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace main_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddProctoring : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "assessment_proctoring_settings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    assessment_id = table.Column<int>(type: "integer", nullable: false),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    require_camera = table.Column<bool>(type: "boolean", nullable: false),
                    require_microphone = table.Column<bool>(type: "boolean", nullable: false),
                    record_video = table.Column<bool>(type: "boolean", nullable: false),
                    take_snapshots = table.Column<bool>(type: "boolean", nullable: false),
                    snapshot_mode = table.Column<string>(type: "text", nullable: false),
                    snapshot_fixed_seconds = table.Column<int>(type: "integer", nullable: false),
                    snapshot_min_seconds = table.Column<int>(type: "integer", nullable: false),
                    snapshot_max_seconds = table.Column<int>(type: "integer", nullable: false),
                    block_copy_paste = table.Column<bool>(type: "boolean", nullable: false),
                    block_tab_switch = table.Column<bool>(type: "boolean", nullable: false),
                    block_right_click = table.Column<bool>(type: "boolean", nullable: false),
                    warn_on_refresh_attempt = table.Column<bool>(type: "boolean", nullable: false),
                    show_warnings_to_student = table.Column<bool>(type: "boolean", nullable: false),
                    max_violations_before_auto_submit = table.Column<int>(type: "integer", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assessment_proctoring_settings", x => x.id);
                    table.ForeignKey(
                        name: "FK_assessment_proctoring_settings_assessments_assessment_id",
                        column: x => x.assessment_id,
                        principalTable: "assessments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "proctoring_events",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    attempt_id = table.Column<int>(type: "integer", nullable: false),
                    event_type = table.Column<string>(type: "text", nullable: false),
                    file_path = table.Column<string>(type: "text", nullable: true),
                    detail = table.Column<string>(type: "text", nullable: true),
                    occurred_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_proctoring_events", x => x.id);
                    table.ForeignKey(
                        name: "FK_proctoring_events_assessment_attempts_attempt_id",
                        column: x => x.attempt_id,
                        principalTable: "assessment_attempts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_assessment_proctoring_settings_assessment_id",
                table: "assessment_proctoring_settings",
                column: "assessment_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_proctoring_events_attempt_id",
                table: "proctoring_events",
                column: "attempt_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "assessment_proctoring_settings");

            migrationBuilder.DropTable(
                name: "proctoring_events");
        }
    }
}
