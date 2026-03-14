using AutoMapper;
using WikiWeaver.Application.DTOs;
using WikiWeaver.Domain.Entities;

namespace WikiWeaver.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Article, ArticleReadDto>()
                .ForMember(dest => dest.HasContent, opt => opt.MapFrom(src => src.Paragraphs.Any(paragraph => paragraph.IsDefault)));
            CreateMap<ArticleCreateDto, Article>();
            CreateMap<ArticleUpdateDto, Article>();

            CreateMap<Paragraph, ParagraphReadDto>();
            CreateMap<ParagraphCreateDto, Paragraph>();
            CreateMap<ParagraphUpdateDto, Paragraph>();
        }
    }
}
