namespace WikiWeaver.Application.Exceptions;

public sealed class NotFoundException : AppException
{
    public NotFoundException(string message, string code = "not_found")
        : base(message, 404, code)
    {
    }
}
