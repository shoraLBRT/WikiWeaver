using WikiWeaver.Application.DTOs;
using WikiWeaver.Application.Services;

namespace WikiWeaver.MinimalApi.Endpoints
{
    public static class NodeEndpoints
    {
        public static IEndpointRouteBuilder MapNodeEndpoints(this IEndpointRouteBuilder builder)
        {
            var group = builder.MapGroup("/nodes").WithTags("Node");

            group.MapGet("/", async (NodeService service) =>
            {
                var nodes = await service.GetAllNodesAsync();
                if (nodes is null) return Results.NotFound();
                return Results.Ok(nodes);
            });

            group.MapGet("/tree", async (NodeService service) =>
            {
                var nodeTree = await service.GetNodeTreeAsync();
                if (nodeTree is null) return Results.NotFound();
                return Results.Ok(nodeTree);
            });

            group.MapGet("/{id:int}", async (int id, NodeService service) =>
            {
                var node = await service.GetNodeByIdAsync(id);
                if (node is null) return Results.NotFound();
                return Results.Ok(node);
            });

            group.MapPost("/", async (NodeCreateDto dto, NodeService service) =>
            {
                var createdNode = await service.CreateNodeAsync(dto);
                return Results.Created($"/nodes/{createdNode.Id}", createdNode);
            });


            group.MapDelete("/{id:int}", async (int id, NodeService service) =>
            {
                var deleted = await service.DeleteNodeAsync(id);
                return deleted ? Results.NoContent() : Results.NotFound();
            });

            return builder;
        }
    }
}
