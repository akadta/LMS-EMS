using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace main_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentLearningTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "assessment_attempts",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    assessment_id = table.Column<int>(type: "integer", nullable: false),
                    student_id = table.Column<int>(type: "integer", nullable: false),
                    mode = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    total_possible = table.Column<double>(type: "double precision", nullable: true),
                    total_awarded = table.Column<double>(type: "double precision", nullable: true),
                    percent = table.Column<double>(type: "double precision", nullable: true),
                    passed = table.Column<bool>(type: "boolean", nullable: true),
                    grade = table.Column<string>(type: "text", nullable: true),
                    faculty_override_unlock = table.Column<bool>(type: "boolean", nullable: false),
                    reviewed_by_faculty_id = table.Column<int>(type: "integer", nullable: true),
                    reviewed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assessment_attempts", x => x.id);
                    table.ForeignKey(
                        name: "FK_assessment_attempts_assessments_assessment_id",
                        column: x => x.assessment_id,
                        principalTable: "assessments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_assessment_attempts_students_student_id",
                        column: x => x.student_id,
                        principalTable: "students",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_chapter_progress",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    student_id = table.Column<int>(type: "integer", nullable: false),
                    chapter_id = table.Column<int>(type: "integer", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_chapter_progress", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "student_course_enrollments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    student_id = table.Column<int>(type: "integer", nullable: false),
                    batch_course_id = table.Column<int>(type: "integer", nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_course_enrollments", x => x.id);
                    table.ForeignKey(
                        name: "FK_student_course_enrollments_batch_courses_batch_course_id",
                        column: x => x.batch_course_id,
                        principalTable: "batch_courses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_student_course_enrollments_students_student_id",
                        column: x => x.student_id,
                        principalTable: "students",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "student_module_progress",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    student_id = table.Column<int>(type: "integer", nullable: false),
                    module_id = table.Column<int>(type: "integer", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_module_progress", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "assessment_attempt_answers",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    attempt_id = table.Column<int>(type: "integer", nullable: false),
                    question_id = table.Column<int>(type: "integer", nullable: false),
                    selected_option_ids = table.Column<string>(type: "text", nullable: true),
                    text_answer = table.Column<string>(type: "text", nullable: true),
                    mark_awarded = table.Column<double>(type: "double precision", nullable: true),
                    faculty_note = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assessment_attempt_answers", x => x.id);
                    table.ForeignKey(
                        name: "FK_assessment_attempt_answers_assessment_attempts_attempt_id",
                        column: x => x.attempt_id,
                        principalTable: "assessment_attempts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_assessment_attempt_answers_assessment_questions_question_id",
                        column: x => x.question_id,
                        principalTable: "assessment_questions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_assessment_attempt_answers_attempt_id",
                table: "assessment_attempt_answers",
                column: "attempt_id");

            migrationBuilder.CreateIndex(
                name: "IX_assessment_attempt_answers_question_id",
                table: "assessment_attempt_answers",
                column: "question_id");

            migrationBuilder.CreateIndex(
                name: "IX_assessment_attempts_assessment_id",
                table: "assessment_attempts",
                column: "assessment_id");

            migrationBuilder.CreateIndex(
                name: "IX_assessment_attempts_student_id",
                table: "assessment_attempts",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_chapter_progress_student_id_chapter_id",
                table: "student_chapter_progress",
                columns: new[] { "student_id", "chapter_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_course_enrollments_batch_course_id",
                table: "student_course_enrollments",
                column: "batch_course_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_course_enrollments_student_id_batch_course_id",
                table: "student_course_enrollments",
                columns: new[] { "student_id", "batch_course_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_student_module_progress_student_id_module_id",
                table: "student_module_progress",
                columns: new[] { "student_id", "module_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "assessment_attempt_answers");

            migrationBuilder.DropTable(
                name: "student_chapter_progress");

            migrationBuilder.DropTable(
                name: "student_course_enrollments");

            migrationBuilder.DropTable(
                name: "student_module_progress");

            migrationBuilder.DropTable(
                name: "assessment_attempts");
        }
    }
}
