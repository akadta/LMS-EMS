using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace main_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddAssessmentTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "assessments",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    course_id = table.Column<int>(type: "integer", nullable: true),
                    module_id = table.Column<int>(type: "integer", nullable: true),
                    chapter_id = table.Column<int>(type: "integer", nullable: true),
                    name = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    mode = table.Column<string>(type: "text", nullable: false),
                    is_timer = table.Column<bool>(type: "boolean", nullable: false),
                    timer_scope = table.Column<string>(type: "text", nullable: true),
                    timer_value = table.Column<int>(type: "integer", nullable: true),
                    timer_unit = table.Column<string>(type: "text", nullable: true),
                    question_format = table.Column<string>(type: "text", nullable: false),
                    option_format = table.Column<string>(type: "text", nullable: false),
                    marking_mode = table.Column<string>(type: "text", nullable: false),
                    is_shuffle = table.Column<bool>(type: "boolean", nullable: false),
                    pass_percentage = table.Column<double>(type: "double precision", nullable: true),
                    questions_to_show = table.Column<int>(type: "integer", nullable: true),
                    is_published = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    is_draft = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assessments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "assessment_grades",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    assessment_id = table.Column<int>(type: "integer", nullable: false),
                    label = table.Column<string>(type: "text", nullable: false),
                    min_percentage = table.Column<double>(type: "double precision", nullable: false),
                    max_percentage = table.Column<double>(type: "double precision", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assessment_grades", x => x.id);
                    table.ForeignKey(
                        name: "FK_assessment_grades_assessments_assessment_id",
                        column: x => x.assessment_id,
                        principalTable: "assessments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "assessment_questions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    assessment_id = table.Column<int>(type: "integer", nullable: false),
                    question_text = table.Column<string>(type: "text", nullable: false),
                    question_type = table.Column<string>(type: "text", nullable: false),
                    mark = table.Column<double>(type: "double precision", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_draft = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assessment_questions", x => x.id);
                    table.ForeignKey(
                        name: "FK_assessment_questions_assessments_assessment_id",
                        column: x => x.assessment_id,
                        principalTable: "assessments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "assessment_options",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    question_id = table.Column<int>(type: "integer", nullable: false),
                    option_text = table.Column<string>(type: "text", nullable: false),
                    is_correct = table.Column<bool>(type: "boolean", nullable: false),
                    mark = table.Column<double>(type: "double precision", nullable: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assessment_options", x => x.id);
                    table.ForeignKey(
                        name: "FK_assessment_options_assessment_questions_question_id",
                        column: x => x.question_id,
                        principalTable: "assessment_questions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "assessment_question_media",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    question_id = table.Column<int>(type: "integer", nullable: false),
                    media_type = table.Column<string>(type: "text", nullable: false),
                    file_path = table.Column<string>(type: "text", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_assessment_question_media", x => x.id);
                    table.ForeignKey(
                        name: "FK_assessment_question_media_assessment_questions_question_id",
                        column: x => x.question_id,
                        principalTable: "assessment_questions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_assessment_grades_assessment_id",
                table: "assessment_grades",
                column: "assessment_id");

            migrationBuilder.CreateIndex(
                name: "IX_assessment_options_question_id",
                table: "assessment_options",
                column: "question_id");

            migrationBuilder.CreateIndex(
                name: "IX_assessment_question_media_question_id",
                table: "assessment_question_media",
                column: "question_id");

            migrationBuilder.CreateIndex(
                name: "IX_assessment_questions_assessment_id",
                table: "assessment_questions",
                column: "assessment_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "assessment_grades");

            migrationBuilder.DropTable(
                name: "assessment_options");

            migrationBuilder.DropTable(
                name: "assessment_question_media");

            migrationBuilder.DropTable(
                name: "assessment_questions");

            migrationBuilder.DropTable(
                name: "assessments");
        }
    }
}
