using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace main_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemRoleToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "system_role_id",
                table: "users",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "system_roles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "text", nullable: false),
                    slug = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_roles", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_users_system_role_id",
                table: "users",
                column: "system_role_id");

            migrationBuilder.AddForeignKey(
                name: "FK_users_system_roles_system_role_id",
                table: "users",
                column: "system_role_id",
                principalTable: "system_roles",
                principalColumn: "id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_users_system_roles_system_role_id",
                table: "users");

            migrationBuilder.DropTable(
                name: "system_roles");

            migrationBuilder.DropIndex(
                name: "IX_users_system_role_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "system_role_id",
                table: "users");
        }
    }
}
