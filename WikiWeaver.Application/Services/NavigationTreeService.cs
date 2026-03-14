using WikiWeaver.Application.DTOs;
using WikiWeaver.Infrastructure.Repositories;

namespace WikiWeaver.Application.Services
{
    public class NavigationTreeService
    {
        private readonly ArticleRepository _articleRepository;

        public NavigationTreeService(ArticleRepository articleRepository)
        {
            _articleRepository = articleRepository;
        }

        public async Task<List<NavigationArticleDto>> GetTreeAsync()
        {
            var articles = await _articleRepository.GetAllWithParagraphsAsync();
            var lookup = articles
                .Select(article => new NavigationArticleDto
                {
                    Id = article.Id,
                    Title = article.Title,
                    ParentArticleId = article.ParentArticleId,
                    HasContent = article.Paragraphs.Any(paragraph => paragraph.IsDefault),
                    Children = new List<NavigationArticleDto>()
                })
                .ToDictionary(article => article.Id);

            var roots = new List<NavigationArticleDto>();

            foreach (var article in lookup.Values)
            {
                if (article.ParentArticleId is null)
                {
                    roots.Add(article);
                    continue;
                }

                if (lookup.TryGetValue(article.ParentArticleId.Value, out var parent))
                {
                    parent.Children ??= new List<NavigationArticleDto>();
                    parent.Children.Add(article);
                }
                else
                {
                    roots.Add(article);
                }
            }

            return roots;
        }
    }
}
