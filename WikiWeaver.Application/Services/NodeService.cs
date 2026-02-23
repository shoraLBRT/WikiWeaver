using AutoMapper;
using WikiWeaver.Application.DTOs;
using WikiWeaver.Application.Exceptions;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Repositories;

namespace WikiWeaver.Application.Services
{
    public class NodeService
    {
        private readonly NodeRepository _nodeRepository;
        private readonly ArticleRepository _articleRepository;
        private readonly IMapper _mapper;

        public NodeService(
            NodeRepository nodeRepository,
            ArticleRepository articleRepository,
            IMapper mapper)
        {
            _nodeRepository = nodeRepository;
            _articleRepository = articleRepository;
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
            ValidateRootNode(createNodeDto.IsRoot, createNodeDto.ParentId);

            var node = _mapper.Map<Node>(createNodeDto);
            if (createNodeDto.IsRoot)
            {
                node.ParentId = null;
            }

            await _nodeRepository.AddAsync(node);
            await _nodeRepository.SaveChangesAsync();
            return _mapper.Map<NodeReadDto>(node);
        }

        public async Task UpdateNodeAsync(int id, NodeUpdateDto dto)
        {
            var node = await _nodeRepository.GetByIdAsync(id);
            if (node is null)
            {
                throw new NotFoundException("Node not found");
            }

            ValidateRootNode(dto.IsRoot, dto.ParentId);

            _mapper.Map(dto, node);
            if (dto.IsRoot)
            {
                node.ParentId = null;
            }

            await _nodeRepository.UpdateAsync(node);
            await _nodeRepository.SaveChangesAsync();
        }

        public async Task DeleteNodeAsync(int id)
        {
            var node = await _nodeRepository.GetByIdAsync(id);
            if (node is null)
            {
                throw new NotFoundException("Node not found");
            }

            var hasChildren = await _nodeRepository.HasChildrenAsync(id);
            if (hasChildren)
            {
                throw new ValidationException("Cannot delete node with children. Delete child nodes first.");
            }

            await DeleteLinkedArticleAsync(id);
            await _nodeRepository.DeleteAsync(node);
            await _nodeRepository.SaveChangesAsync();
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

        private static void ValidateRootNode(bool isRoot, int? parentId)
        {
            if (isRoot && parentId.HasValue)
            {
                throw new ValidationException("Root node cannot have a parent.");
            }
        }

        private async Task DeleteLinkedArticleAsync(int nodeId)
        {
            var linkedArticle = await _articleRepository.GetByNodeIdAsync(nodeId);
            if (linkedArticle is null)
            {
                return;
            }

            await _articleRepository.DeleteAsync(linkedArticle);
            await _articleRepository.SaveChangesAsync();
        }
    }
}
