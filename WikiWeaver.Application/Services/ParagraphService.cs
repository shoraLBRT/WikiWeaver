using AutoMapper;
using WikiWeaver.Application.DTOs;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Repositories;

namespace WikiWeaver.Application.Services
{
    public class ParagraphService
    {
        private readonly ParagraphRepository _repository;
        private readonly IMapper _mapper;

        public ParagraphService(ParagraphRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<ParagraphReadDto>> GetAllAsync()
        {
            var paragraphs = await _repository.GetAllAsync();
            return _mapper.Map<IEnumerable<ParagraphReadDto>>(paragraphs);
        }

        public async Task<ParagraphReadDto?> GetByIdAsync(int id)
        {
            var paragraph = await _repository.GetByIdAsync(id);
            return paragraph is not null ? _mapper.Map<ParagraphReadDto>(paragraph) : null;
        }

        public async Task<ParagraphReadDto> CreateAsync(ParagraphCreateDto createDto)
        {
            var paragraph = _mapper.Map<Paragraph>(createDto);
            await _repository.AddAsync(paragraph);
            await _repository.SaveChangesAsync();
            return _mapper.Map<ParagraphReadDto>(paragraph);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var paragraph = await _repository.GetByIdAsync(id);
            if (paragraph is null) return false;

            await _repository.DeleteAsync(paragraph);
            await _repository.SaveChangesAsync();
            return true;
        }
    }
}
