using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WikiWeaver.Infrastructure.Migrations
{
    [DbContext(typeof(Data.WikiWeaverDbContext))]
    [Migration("20260313120000_MigrateNodesToArticles")]
    public partial class MigrateNodesToArticles : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ParentArticleId",
                table: "Articles",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.Sql(
                @"
UPDATE Articles
SET ParentArticleId = (
    SELECT parentNode.ArticleId
    FROM Nodes AS currentNode
    LEFT JOIN Nodes AS parentNode ON currentNode.ParentId = parentNode.Id
    WHERE currentNode.Id = Articles.NodeId
);");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_ParentArticleId",
                table: "Articles",
                column: "ParentArticleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Articles_Articles_ParentArticleId",
                table: "Articles",
                column: "ParentArticleId",
                principalTable: "Articles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.DropForeignKey(
                name: "FK_Articles_Nodes_NodeId",
                table: "Articles");

            migrationBuilder.DropIndex(
                name: "IX_Articles_NodeId",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "NodeId",
                table: "Articles");

            migrationBuilder.DropTable(
                name: "Nodes");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "NodeId",
                table: "Articles",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Nodes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ArticleId = table.Column<int>(type: "INTEGER", nullable: true),
                    ParentId = table.Column<int>(type: "INTEGER", nullable: true),
                    Title = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Nodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Nodes_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Nodes_Nodes_ParentId",
                        column: x => x.ParentId,
                        principalTable: "Nodes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.Sql(
                @"
INSERT INTO Nodes (Title, ParentId, ArticleId)
SELECT article.Title, NULL, article.Id
FROM Articles AS article;

UPDATE Articles
SET NodeId = (
    SELECT node.Id
    FROM Nodes AS node
    WHERE node.ArticleId = Articles.Id
    LIMIT 1
);");

            migrationBuilder.CreateIndex(
                name: "IX_Nodes_ArticleId",
                table: "Nodes",
                column: "ArticleId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Nodes_ParentId",
                table: "Nodes",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_NodeId",
                table: "Articles",
                column: "NodeId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Articles_Nodes_NodeId",
                table: "Articles",
                column: "NodeId",
                principalTable: "Nodes",
                principalColumn: "Id");

            migrationBuilder.DropForeignKey(
                name: "FK_Articles_Articles_ParentArticleId",
                table: "Articles");

            migrationBuilder.DropIndex(
                name: "IX_Articles_ParentArticleId",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "ParentArticleId",
                table: "Articles");
        }
    }
}
