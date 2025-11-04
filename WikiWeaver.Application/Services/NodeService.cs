// WikiWeaver.Application/Services/NodeService.cs
using AutoMapper;
using WikiWeaver.Application.DTOs;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Repositories;

namespace WikiWeaver.Application.Services
{
    public class NodeService
    {
        private readonly NodeRepository _nodeRepository;
        private readonly IMapper _mapper;
        public NodeService(NodeRepository nodeRepository, IMapper mapper)
        {
            _nodeRepository = nodeRepository;
            _mapper = mapper;
        }

        public async Task<List<NodeReadDto>> GetAllNodesAsync()
        {
            var nodes = await _nodeRepository.GetAllAsync();
            return _mapper.Map<List<NodeReadDto>>(nodes.ToList());
        }

        public async Task<NodeReadDto?> GetNodeByIdAsync(int id)
        {
            var node = await _nodeRepository.GetByIdAsync(id);
            return _mapper.Map<NodeReadDto?>(node);
        }

        public async Task<NodeReadDto> CreateNodeAsync(NodeCreateDto createNodeDto)
        {
            var node = _mapper.Map<Node>(createNodeDto);
            await _nodeRepository.AddAsync(node);
            await _nodeRepository.SaveChangesAsync();
            return _mapper.Map<NodeReadDto>(node);
        }

        public async Task<bool> DeleteNodeAsync(int id)
        {
            var node = await _nodeRepository.GetByIdAsync(id);
            if (node is null) return false;

            await _nodeRepository.DeleteAsync(node);
            await _nodeRepository.SaveChangesAsync();
            return true;
        }
        public async Task<List<NodeReadDto>> GetNodeTreeAsync()
        {
            var nodes = await _nodeRepository.GetAllAsync();
            var nodeDtos = _mapper.Map<List<NodeReadDto>>(nodes);

            var lookup = nodeDtos.ToDictionary(n => n.Id);
            var roots = new List<NodeReadDto>();

            foreach (var node in nodeDtos)
            {
                if (node.ParentId is null)
                {
                    roots.Add(node);
                }
                else if (lookup.TryGetValue(node.ParentId.Value, out var parent))
                {
                    parent.Children ??= new List<NodeReadDto>();
                    parent.Children.Add(node);
                }
            }

            return roots;
        }
    }
}
