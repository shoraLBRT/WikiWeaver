using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using WikiWeaver.Application.DTOs;
using WikiWeaver.Application.Mappings;
using WikiWeaver.Application.Services;
using WikiWeaver.Domain.Entities;
using WikiWeaver.Infrastructure.Repositories;

namespace WikiWeaver.Application.Tests;

public class ParagraphOrderingTests : IDisposable
{
    private readonly Infrastructure.Data.WikiWeaverDbContext _context;
    private readonly ParagraphRepository _repository;
    private readonly ParagraphService _service;

    public ParagraphOrderingTests()
    {
        _context = TestDbHelper.CreateInMemoryContext();
        _repository = new ParagraphRepository(_context);

        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>(), NullLoggerFactory.Instance);
        var mapper = config.CreateMapper();
        _service = new ParagraphService(_repository, mapper);
    }

    public void Dispose() => _context.Dispose();

    private async Task<Article> SeedArticleWithParagraphs(params int[] orders)
    {
        var article = new Article { Title = "Test Article" };
        _context.Articles.Add(article);
        await _context.SaveChangesAsync();

        foreach (var order in orders)
        {
            _context.Paragraphs.Add(new Paragraph
            {
                ArticleId = article.Id,
                Content = $"Paragraph {order}",
                Order = order,
                IsDefault = true
            });
        }
        await _context.SaveChangesAsync();

        return article;
    }

    #region CreateAsync — ordering

    [Fact]
    public async Task CreateAsync_InsertAtEnd_DoesNotShiftOthers()
    {
        var article = await SeedArticleWithParagraphs(1, 2);

        await _service.CreateAsync(new ParagraphCreateDto
        {
            ArticleId = article.Id,
            Content = "New paragraph",
            Order = 3
        });

        var paragraphs = await _repository.GetParagraphsByArticleAsync(article.Id);
        paragraphs.Select(p => p.Order).Order().Should().BeEquivalentTo([1, 2, 3]);
    }

    [Fact]
    public async Task CreateAsync_InsertAtBeginning_ShiftsAllExisting()
    {
        var article = await SeedArticleWithParagraphs(1, 2);

        await _service.CreateAsync(new ParagraphCreateDto
        {
            ArticleId = article.Id,
            Content = "New first",
            Order = 1
        });

        var paragraphs = (await _repository.GetParagraphsByArticleAsync(article.Id))
            .OrderBy(p => p.Order).ToList();

        paragraphs.Should().HaveCount(3);
        paragraphs[0].Content.Should().Be("New first");
        paragraphs[0].Order.Should().Be(1);
        paragraphs[1].Order.Should().Be(2);
        paragraphs[2].Order.Should().Be(3);
    }

    [Fact]
    public async Task CreateAsync_InsertInMiddle_ShiftsSubsequent()
    {
        var article = await SeedArticleWithParagraphs(1, 2, 3);

        await _service.CreateAsync(new ParagraphCreateDto
        {
            ArticleId = article.Id,
            Content = "Inserted at 2",
            Order = 2
        });

        var paragraphs = (await _repository.GetParagraphsByArticleAsync(article.Id))
            .OrderBy(p => p.Order).ToList();

        paragraphs.Should().HaveCount(4);
        paragraphs[1].Content.Should().Be("Inserted at 2");
        paragraphs[1].Order.Should().Be(2);
        paragraphs[2].Content.Should().Be("Paragraph 2");
        paragraphs[2].Order.Should().Be(3);
        paragraphs[3].Content.Should().Be("Paragraph 3");
        paragraphs[3].Order.Should().Be(4);
    }

    [Fact]
    public async Task CreateAsync_OrderExceedsMaxPlusOne_ThrowsValidation()
    {
        var article = await SeedArticleWithParagraphs(1, 2);

        var act = () => _service.CreateAsync(new ParagraphCreateDto
        {
            ArticleId = article.Id,
            Content = "Too far",
            Order = 4
        });

        await act.Should().ThrowAsync<Application.Exceptions.ValidationException>();
    }

    #endregion

    #region UpdateAsync — reordering

    [Fact]
    public async Task UpdateAsync_MoveDown_ShiftsIntermediateUp()
    {
        var article = await SeedArticleWithParagraphs(1, 2, 3);
        var paragraphs = await _repository.GetParagraphsByArticleAsync(article.Id);
        var first = paragraphs.First(p => p.Order == 1);

        await _service.UpdateAsync(first.Id, new ParagraphUpdateDto
        {
            Content = first.Content,
            ArticleId = article.Id,
            Order = 3
        });

        var updated = (await _repository.GetParagraphsByArticleAsync(article.Id))
            .OrderBy(p => p.Order).ToList();

        updated.First(p => p.Id == first.Id).Order.Should().Be(3);
        updated.Where(p => p.Id != first.Id).Select(p => p.Order).Should().BeEquivalentTo([1, 2]);
    }

    [Fact]
    public async Task UpdateAsync_MoveUp_ShiftsIntermediateDown()
    {
        var article = await SeedArticleWithParagraphs(1, 2, 3);
        var paragraphs = await _repository.GetParagraphsByArticleAsync(article.Id);
        var last = paragraphs.First(p => p.Order == 3);

        await _service.UpdateAsync(last.Id, new ParagraphUpdateDto
        {
            Content = last.Content,
            ArticleId = article.Id,
            Order = 1
        });

        var updated = (await _repository.GetParagraphsByArticleAsync(article.Id))
            .OrderBy(p => p.Order).ToList();

        updated.First(p => p.Id == last.Id).Order.Should().Be(1);
        updated.Where(p => p.Id != last.Id).Select(p => p.Order).Should().BeEquivalentTo([2, 3]);
    }

    [Fact]
    public async Task UpdateAsync_SameOrder_NoShift()
    {
        var article = await SeedArticleWithParagraphs(1, 2, 3);
        var paragraphs = await _repository.GetParagraphsByArticleAsync(article.Id);
        var second = paragraphs.First(p => p.Order == 2);

        await _service.UpdateAsync(second.Id, new ParagraphUpdateDto
        {
            Content = "Updated content",
            ArticleId = article.Id,
            Order = 2
        });

        var updated = (await _repository.GetParagraphsByArticleAsync(article.Id))
            .OrderBy(p => p.Order).ToList();

        updated.Select(p => p.Order).Should().BeEquivalentTo([1, 2, 3]);
        updated.First(p => p.Id == second.Id).Content.Should().Be("Updated content");
    }

    #endregion
}
