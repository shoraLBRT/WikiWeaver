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
                return Results.Ok(nodes);
            });

            group.MapGet("/tree", async (NodeService service) =>
            {
                var nodeTree = await service.GetNodeTreeAsync();
                return Results.Ok(nodeTree);
            });

            group.MapGet("/{id:int}", async (int id, NodeService service) =>
            {
                var node = await service.GetNodeByIdAsync(id);
                return node is null ? Results.NotFound() : Results.Ok(node);
            });

            group.MapPost("/", async (NodeCreateDto dto, NodeService service) =>
            {
                var createdNode = await service.CreateNodeAsync(dto);
                return Results.Created($"/nodes/{createdNode.Id}", createdNode);
            }).RequireAuthorization("AdminOnly");

            group.MapPut("/{id:int}", async (int id, NodeUpdateDto dto, NodeService service) =>
            {
                await service.UpdateNodeAsync(id, dto);
                return Results.NoContent();
            }).RequireAuthorization("AdminOnly");

            group.MapDelete("/{id:int}", async (int id, NodeService service) =>
            {
                await service.DeleteNodeAsync(id);
                return Results.NoContent();
            }).RequireAuthorization("AdminOnly");

            return builder;
        }
    }
}
