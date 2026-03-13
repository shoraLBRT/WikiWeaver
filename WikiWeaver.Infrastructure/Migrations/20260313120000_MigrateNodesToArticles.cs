using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WikiWeaver.Infrastructure.Migrations
{
    public partial class MigrateNodesToArticles : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
PRAGMA foreign_keys = OFF;

CREATE TABLE __Paragraphs_backup AS
SELECT Id, Content, ArticleId, [Order], IsDefault
FROM Paragraphs;

DROP TABLE Paragraphs;

CREATE TABLE __Articles_new (
    Id INTEGER NOT NULL CONSTRAINT PK_Articles PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    ParentArticleId INTEGER NULL,
    CONSTRAINT FK_Articles_Articles_ParentArticleId FOREIGN KEY (ParentArticleId) REFERENCES Articles (Id) ON DELETE RESTRICT
);

INSERT INTO __Articles_new (Id, Title, ParentArticleId)
SELECT
    article.Id,
    article.Title,
    parentNode.ArticleId
FROM Articles AS article
LEFT JOIN Nodes AS currentNode ON article.NodeId = currentNode.Id
LEFT JOIN Nodes AS parentNode ON currentNode.ParentId = parentNode.Id;

DROP TABLE Articles;
ALTER TABLE __Articles_new RENAME TO Articles;
CREATE INDEX IX_Articles_ParentArticleId ON Articles (ParentArticleId);

CREATE TABLE Paragraphs (
    Id INTEGER NOT NULL CONSTRAINT PK_Paragraphs PRIMARY KEY AUTOINCREMENT,
    Content TEXT NOT NULL,
    ArticleId INTEGER NOT NULL,
    [Order] INTEGER NOT NULL,
    IsDefault INTEGER NOT NULL,
    CONSTRAINT FK_Paragraphs_Articles_ArticleId FOREIGN KEY (ArticleId) REFERENCES Articles (Id) ON DELETE CASCADE
);

INSERT INTO Paragraphs (Id, Content, ArticleId, [Order], IsDefault)
SELECT Id, Content, ArticleId, [Order], IsDefault
FROM __Paragraphs_backup;

DROP TABLE __Paragraphs_backup;
DROP TABLE Nodes;

PRAGMA foreign_keys = ON;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
PRAGMA foreign_keys = OFF;

CREATE TABLE Nodes (
    Id INTEGER NOT NULL CONSTRAINT PK_Nodes PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    ParentId INTEGER NULL,
    ArticleId INTEGER NULL,
    CONSTRAINT FK_Nodes_Nodes_ParentId FOREIGN KEY (ParentId) REFERENCES Nodes (Id) ON DELETE RESTRICT,
    CONSTRAINT FK_Nodes_Articles_ArticleId FOREIGN KEY (ArticleId) REFERENCES Articles (Id)
);

ALTER TABLE Articles ADD COLUMN NodeId INTEGER NULL;
CREATE INDEX IX_Articles_NodeId ON Articles (NodeId);

PRAGMA foreign_keys = ON;");
        }
    }
}
