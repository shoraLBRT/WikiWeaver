using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WikiWeaver.Infrastructure.Migrations
{
    [DbContext(typeof(Data.WikiWeaverDbContext))]
    [Migration("20260401120000_AddMarkdownStylingPrompt")]
    public partial class AddMarkdownStylingPrompt : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MarkdownStylingSystemPrompt",
                table: "AiProviderSettings",
                type: "TEXT",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MarkdownStylingSystemPrompt",
                table: "AiProviderSettings");
        }
    }
}
