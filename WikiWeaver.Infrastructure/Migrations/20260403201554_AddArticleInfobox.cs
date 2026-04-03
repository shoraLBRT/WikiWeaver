using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WikiWeaver.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddArticleInfobox : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InfoboxSubtitle",
                table: "Articles",
                type: "TEXT",
                maxLength: 240,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InfoboxTitle",
                table: "Articles",
                type: "TEXT",
                maxLength: 160,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ArticleInfoboxFields",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ArticleId = table.Column<int>(type: "INTEGER", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false),
                    Key = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    Label = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    Value = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleInfoboxFields", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ArticleInfoboxFields_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ArticleInfoboxFields_ArticleId_Order",
                table: "ArticleInfoboxFields",
                columns: new[] { "ArticleId", "Order" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ArticleInfoboxFields");

            migrationBuilder.DropColumn(
                name: "InfoboxSubtitle",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "InfoboxTitle",
                table: "Articles");
        }
    }
}
