using Microsoft.EntityFrameworkCore;
using WikiWeaver.Domain.Entities;

namespace WikiWeaver.Infrastructure.Data
{
    public class WikiWeaverDbContext : DbContext
    {
        public WikiWeaverDbContext(DbContextOptions<WikiWeaverDbContext> options)
            : base(options)
        { }

        public DbSet<Article> Articles { get; set; } = null!;
        public DbSet<Paragraph> Paragraphs { get; set; } = null!;
        public DbSet<AiProviderSettings> AiProviderSettings { get; set; } = null!;
        public DbSet<AdminUser> AdminUsers { get; set; } = null!;
        public DbSet<AdminInviteToken> AdminInviteTokens { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Article>()
                .HasMany(article => article.ChildArticles)
                .WithOne(article => article.ParentArticle)
                .HasForeignKey(article => article.ParentArticleId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Article>()
                .HasMany(article => article.Paragraphs)
                .WithOne(paragraph => paragraph.Article)
                .HasForeignKey(paragraph => paragraph.ArticleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AiProviderSettings>()
                .Property(settings => settings.BaseUrl)
                .HasMaxLength(512);

            modelBuilder.Entity<AiProviderSettings>()
                .Property(settings => settings.Model)
                .HasMaxLength(120);

            modelBuilder.Entity<AdminUser>()
                .HasIndex(admin => admin.Email)
                .IsUnique();

            modelBuilder.Entity<AdminUser>()
                .Property(admin => admin.Email)
                .HasMaxLength(320);

            modelBuilder.Entity<AdminInviteToken>()
                .HasIndex(token => token.TokenHash)
                .IsUnique();

            modelBuilder.Entity<AdminInviteToken>()
                .Property(token => token.TokenHash)
                .HasMaxLength(128);

            modelBuilder.Entity<AdminInviteToken>()
                .HasOne(token => token.CreatedByAdmin)
                .WithMany()
                .HasForeignKey(token => token.CreatedByAdminId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AdminInviteToken>()
                .HasOne(token => token.UsedByAdmin)
                .WithMany()
                .HasForeignKey(token => token.UsedByAdminId)
                .OnDelete(DeleteBehavior.Restrict);

            base.OnModelCreating(modelBuilder);
        }
    }
}
