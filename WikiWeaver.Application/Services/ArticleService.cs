// WikiWeaver.Application/Services/ArticleService.cs
using AutoMapper;
using WikiWeaver.Application.DTOs;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Repositories;

namespace WikiWeaver.Application.Services
{
    public class ArticleService
    {
        private readonly ArticleRepository _repository;
        private readonly IMapper _mapper;

        public ArticleService(ArticleRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ArticleReadDto>> GetAllAsync()
        {
            var articles = await _repository.GetAllAsync();
            return _mapper.Map<IEnumerable<ArticleReadDto>>(articles);
        }

        public async Task<ArticleReadDto?> GetByIdAsync(int id)
        {
            var article = await _repository.GetByIdAsync(id);
            return article == null ? null : _mapper.Map<ArticleReadDto>(article);
        }

        public async Task<ArticleReadDto> CreateAsync(ArticleCreateDto createDto)
        {
            var article = _mapper.Map<Article>(createDto);
            await _repository.AddAsync(article);
            await _repository.SaveChangesAsync();

            return _mapper.Map<ArticleReadDto>(article);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var article = await _repository.GetByIdAsync(id);
            if (article is null) return false;

            await _repository.DeleteAsync(article);
            await _repository.SaveChangesAsync();
            return true;
        }
    }
}
