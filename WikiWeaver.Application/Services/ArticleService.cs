using AutoMapper;
using WikiWeaver.Application.DTOs;
using WikiWeaver.Application.Exceptions;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Repositories;

namespace WikiWeaver.Application.Services
{
    public class ArticleService
    {
        private readonly ArticleRepository _articleRepository;
        private readonly IMapper _mapper;

        public ArticleService(ArticleRepository articleRepository, IMapper mapper)
        {
            _articleRepository = articleRepository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ArticleReadDto>> GetAllAsync()
        {
            var articles = await _articleRepository.GetAllWithParagraphsAsync();
            return _mapper.Map<IEnumerable<ArticleReadDto>>(articles);
        }

        public async Task<ArticleReadDto?> GetByIdAsync(int id)
        {
            var article = await _articleRepository.GetByIdAsync(id);
            return article == null ? null : _mapper.Map<ArticleReadDto>(article);
        }

        public async Task<ArticleReadDto> CreateAsync(ArticleCreateDto createDto)
        {
            var article = _mapper.Map<Article>(createDto);
            await _articleRepository.AddAsync(article);
            await _articleRepository.SaveChangesAsync();

            return _mapper.Map<ArticleReadDto>(article);
        }

        public async Task UpdateAsync(int id, ArticleUpdateDto updateDto)
        {
            var article = await _articleRepository.GetByIdAsync(id);
            if (article is null)
            {
                throw new NotFoundException("Article not found");
            }

            _mapper.Map(updateDto, article);
            await _articleRepository.UpdateAsync(article);
            await _articleRepository.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var article = await _articleRepository.GetByIdAsync(id);
            if (article is null)
            {
                throw new NotFoundException("Article not found");
            }

            await _articleRepository.DeleteAsync(article);
            await _articleRepository.SaveChangesAsync();
        }
    }
}
