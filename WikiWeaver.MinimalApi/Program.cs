using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WikiWeaver.Application;
using WikiWeaver.Application.DTOs;
using WikiWeaver.Application.Mappings;
using WikiWeaver.Application.Services;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure;
using WikiWeaver.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<WikiWeaverDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddInfrastructure();
builder.Services.AddApplication();

builder.Services.AddAutoMapper(
    cfg => { },
    typeof(MappingProfile)
);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

#region Node Endpoints

app.MapGet("/nodes", async (NodeService service) =>
{
    var nodes = await service.GetAllNodesAsync();
    if(nodes is null) return Results.NotFound();
    return Results.Ok(nodes);
});

app.MapGet("/nodes/tree", async (NodeService service) =>
{
    var nodeTree = await service.GetNodeTreeAsync();
    if (nodeTree is null) return Results.NotFound();
    return Results.Ok(nodeTree);
});

app.MapGet("/nodes/{id:int}", async (int id, NodeService service) =>
{
    var node = await service.GetNodeByIdAsync(id);
    if(node is null) return Results.NotFound();
    return Results.Ok(node);
});

app.MapPost("/nodes", async (NodeCreateDto dto, NodeService service) =>
{
    var createdNode = await service.CreateNodeAsync(dto);
    return Results.Created($"/nodes/{createdNode.Id}", createdNode);
});


app.MapDelete("/nodes/{id:int}", async (int id, NodeService service) =>
{
    var deleted = await service.DeleteNodeAsync(id);
    return deleted ? Results.NoContent() : Results.NotFound();
});

#endregion
app.Run();

