using AutoMapper;
using WikiWeaver.Application.DTOs;
using WikiWeaver.Domain.Entities;

namespace WikiWeaver.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Node, NodeDto>()
                .ForMember(dest => dest.ChildrenIds, opt => opt.MapFrom(src => src.Children.Select(c => c.Id)))
                .ForMember(dest => dest.Children, opt => opt.Ignore()); // Всегда игнорируем Children, добавим вручную если нужно

            CreateMap<CreateNodeDto, Node>()
                .ForMember(d => d.Id, o => o.Ignore()); // Id задаёт БД
        }
    }
}
