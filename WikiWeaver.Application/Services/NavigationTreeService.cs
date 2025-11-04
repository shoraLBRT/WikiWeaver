using AutoMapper;
using WikiWeaver.Application.DTOs;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Repositories;

namespace WikiWeaver.Application.Services
{
    public class NavigationTreeService
    {
        private readonly NodeRepository _nodeRepository;
        private readonly IMapper _mapper;

        public NavigationTreeService(NodeRepository nodeRepository, IMapper mapper)
        {
            _nodeRepository = nodeRepository;
            _mapper = mapper;
        }

        public async Task<List<NavigationNodeDto>?> GetTreeAsync(bool hideEmpty = false)
        {
            var nodes = await _nodeRepository.GetAllNodesWithArticlesAsync();
            if (nodes is null) return null;
            var result = nodes.Where(n => n.ParentId is null).ToList();
            return _mapper.Map<List<NavigationNodeDto>>(result);
        }
    }
}
