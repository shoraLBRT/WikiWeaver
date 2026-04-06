using FluentAssertions;
using NSubstitute;
using WikiWeaver.Application.DTOs;
using WikiWeaver.Application.Services;
using WikiWeaver.Infrastructure.Repositories;
using WikiWeaver.Infrastructure.UnitOfWork;

namespace WikiWeaver.Application.Tests;

public class ArticleContentValidationTests : IDisposable
{
    private readonly ArticleContentService _service;
    private readonly Infrastructure.Data.WikiWeaverDbContext _context;

    public ArticleContentValidationTests()
    {
        _context = TestDbHelper.CreateInMemoryContext();
        var articleRepo = new ArticleRepository(_context);
        var paragraphRepo = new ParagraphRepository(_context);
        var uow = Substitute.For<IUnitOfWork>();
        _service = new ArticleContentService(articleRepo, paragraphRepo, uow);
    }

    public void Dispose() => _context.Dispose();

    #region ValidateOrder

    [Fact]
    public void ValidateOrder_ContiguousSequenceWithDefaults_ReturnsValid()
    {
        var paragraphs = new List<ParagraphDto>
        {
            new(0, "P1", 1, true),
            new(0, "P2", 2, true),
            new(0, "P3", 3, true),
        };

        var (isValid, error) = _service.ValidateOrder(paragraphs);

        isValid.Should().BeTrue();
        error.Should().BeNull();
    }

    [Fact]
    public void ValidateOrder_MultipleAlternativesPerOrder_ValidWhenOneIsDefault()
    {
        var paragraphs = new List<ParagraphDto>
        {
            new(0, "P1-default", 1, true),
            new(0, "P1-alt", 1, false),
            new(0, "P2-default", 2, true),
        };

        var (isValid, _) = _service.ValidateOrder(paragraphs);

        isValid.Should().BeTrue();
    }

    [Fact]
    public void ValidateOrder_EmptyList_ReturnsInvalid()
    {
        var (isValid, error) = _service.ValidateOrder(new List<ParagraphDto>());

        isValid.Should().BeFalse();
        error.Should().Contain("At least one paragraph");
    }

    [Fact]
    public void ValidateOrder_GapInSequence_ReturnsInvalid()
    {
        var paragraphs = new List<ParagraphDto>
        {
            new(0, "P1", 1, true),
            new(0, "P3", 3, true),
        };

        var (isValid, error) = _service.ValidateOrder(paragraphs);

        isValid.Should().BeFalse();
        error.Should().Contain("contiguous");
    }

    [Fact]
    public void ValidateOrder_OrderStartingAtTwo_ReturnsInvalid()
    {
        var paragraphs = new List<ParagraphDto>
        {
            new(0, "P2", 2, true),
            new(0, "P3", 3, true),
        };

        var (isValid, _) = _service.ValidateOrder(paragraphs);

        isValid.Should().BeFalse();
    }

    [Fact]
    public void ValidateOrder_ZeroOrder_ReturnsInvalid()
    {
        var paragraphs = new List<ParagraphDto>
        {
            new(0, "P0", 0, true),
        };

        var (isValid, error) = _service.ValidateOrder(paragraphs);

        isValid.Should().BeFalse();
        error.Should().Contain(">= 1");
    }

    [Fact]
    public void ValidateOrder_OrderWithoutDefault_ReturnsInvalid()
    {
        var paragraphs = new List<ParagraphDto>
        {
            new(0, "P1", 1, true),
            new(0, "P2-alt1", 2, false),
            new(0, "P2-alt2", 2, false),
        };

        var (isValid, error) = _service.ValidateOrder(paragraphs);

        isValid.Should().BeFalse();
        error.Should().Contain("default paragraph");
    }

    #endregion

    #region ValidateInfobox

    [Fact]
    public void ValidateInfobox_Null_ReturnsValid()
    {
        var (isValid, _) = _service.ValidateInfobox(null);

        isValid.Should().BeTrue();
    }

    [Fact]
    public void ValidateInfobox_EmptyFields_ReturnsValid()
    {
        var infobox = new ArticleInfoboxCreateDto("Title", null, new List<ArticleInfoboxFieldCreateDto>());

        var (isValid, _) = _service.ValidateInfobox(infobox);

        isValid.Should().BeTrue();
    }

    [Fact]
    public void ValidateInfobox_ContiguousFieldOrders_ReturnsValid()
    {
        var fields = new List<ArticleInfoboxFieldCreateDto>
        {
            new(1, "key1", "Label 1", "Value 1"),
            new(2, "key2", "Label 2", "Value 2"),
        };
        var infobox = new ArticleInfoboxCreateDto("Title", null, fields);

        var (isValid, _) = _service.ValidateInfobox(infobox);

        isValid.Should().BeTrue();
    }

    [Fact]
    public void ValidateInfobox_GapInFieldOrders_ReturnsInvalid()
    {
        var fields = new List<ArticleInfoboxFieldCreateDto>
        {
            new(1, "key1", "Label 1", "Value 1"),
            new(3, "key3", "Label 3", "Value 3"),
        };
        var infobox = new ArticleInfoboxCreateDto("Title", null, fields);

        var (isValid, error) = _service.ValidateInfobox(infobox);

        isValid.Should().BeFalse();
        error.Should().Contain("contiguous");
    }

    [Fact]
    public void ValidateInfobox_EmptyKey_ReturnsInvalid()
    {
        var fields = new List<ArticleInfoboxFieldCreateDto>
        {
            new(1, "", "Label", "Value"),
        };
        var infobox = new ArticleInfoboxCreateDto(null, null, fields);

        var (isValid, error) = _service.ValidateInfobox(infobox);

        isValid.Should().BeFalse();
        error.Should().Contain("key");
    }

    [Fact]
    public void ValidateInfobox_EmptyLabel_ReturnsInvalid()
    {
        var fields = new List<ArticleInfoboxFieldCreateDto>
        {
            new(1, "key", " ", "Value"),
        };
        var infobox = new ArticleInfoboxCreateDto(null, null, fields);

        var (isValid, error) = _service.ValidateInfobox(infobox);

        isValid.Should().BeFalse();
        error.Should().Contain("label");
    }

    #endregion

    #region NormalizeInfobox

    [Fact]
    public void NormalizeInfobox_Null_ReturnsNull()
    {
        _service.NormalizeInfobox(null).Should().BeNull();
    }

    [Fact]
    public void NormalizeInfobox_AllEmpty_ReturnsNull()
    {
        var infobox = new ArticleInfoboxCreateDto("  ", "  ", new List<ArticleInfoboxFieldCreateDto>());

        _service.NormalizeInfobox(infobox).Should().BeNull();
    }

    [Fact]
    public void NormalizeInfobox_TrimsFieldValues()
    {
        var fields = new List<ArticleInfoboxFieldCreateDto>
        {
            new(1, "  key1  ", "  Label 1  ", "  Value 1  "),
        };
        var infobox = new ArticleInfoboxCreateDto("Title", null, fields);

        var result = _service.NormalizeInfobox(infobox);

        result.Should().NotBeNull();
        result!.Fields[0].Key.Should().Be("key1");
        result.Fields[0].Label.Should().Be("Label 1");
        result.Fields[0].Value.Should().Be("Value 1");
    }

    [Fact]
    public void NormalizeInfobox_FiltersBlankFields()
    {
        var fields = new List<ArticleInfoboxFieldCreateDto>
        {
            new(1, "key1", "Label 1", "Value 1"),
            new(2, "  ", "  ", "  "),
        };
        var infobox = new ArticleInfoboxCreateDto("Title", null, fields);

        var result = _service.NormalizeInfobox(infobox);

        result.Should().NotBeNull();
        result!.Fields.Should().HaveCount(1);
    }

    [Fact]
    public void NormalizeInfobox_TrimsTitleAndSubtitle()
    {
        var infobox = new ArticleInfoboxCreateDto("  Title  ", "  Sub  ", new List<ArticleInfoboxFieldCreateDto>());

        var result = _service.NormalizeInfobox(infobox);

        result.Should().NotBeNull();
        result!.Title.Should().Be("Title");
        result.Subtitle.Should().Be("Sub");
    }

    #endregion
}
