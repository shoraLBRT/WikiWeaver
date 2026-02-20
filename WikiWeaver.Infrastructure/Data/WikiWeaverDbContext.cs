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
        public DbSet<Node> Nodes { get; set; } = null!;
        public DbSet<AiProviderSettings> AiProviderSettings { get; set; } = null!;


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Node self-reference
            modelBuilder.Entity<Node>()
                .HasMany(n => n.Children)
                .WithOne(n => n.Parent)
                .HasForeignKey(n => n.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            // Node -> Article (1-1)
            modelBuilder.Entity<Node>()
                .HasOne(n => n.Article)
                .WithOne(a => a.Node)
                .HasForeignKey<Article>(a => a.NodeId);

            // AI provider settings
            modelBuilder.Entity<AiProviderSettings>()
                .Property(settings => settings.BaseUrl)
                .HasMaxLength(512);

            modelBuilder.Entity<AiProviderSettings>()
                .Property(settings => settings.Model)
                .HasMaxLength(120);

            modelBuilder.Entity<Article>()
                .HasMany(a => a.Paragraphs)
                .WithOne(p => p.Article)
                .HasForeignKey(p => p.ArticleId)
                .OnDelete(DeleteBehavior.Cascade);

            base.OnModelCreating(modelBuilder);
        }
    }
}
