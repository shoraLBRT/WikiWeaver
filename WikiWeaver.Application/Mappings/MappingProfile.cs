using AutoMapper;
using WikiWeaver.Application.DTOs;
using WikiWeaver.Domain.Entities;

namespace WikiWeaver.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Node mappings
            CreateMap<Node, NodeReadDto>()
                .ForMember(dest => dest.ChildrenIds, opt => opt.MapFrom(src => src.Children.Select(c => c.Id)))
                .ForMember(dest => dest.Children, opt => opt.Ignore()); // Always ignoring Children, will add if need

            CreateMap<NodeCreateDto, Node>()
                .ForMember(d => d.Id, o => o.Ignore()); // Id setting by DB 

            // Article mappings
            CreateMap<Article, ArticleReadDto>();
            CreateMap<ArticleCreateDto, Article>();

            // Paragraph mappings
            CreateMap<Paragraph, ParagraphReadDto>();
            CreateMap<ParagraphCreateDto, Paragraph>();

            // Navigation node mappings
            CreateMap<Node, NavigationNodeDto>()
                .ForMember(dest => dest.Article, opt => opt.MapFrom(src => src.Article));
        }
    }
}
