namespace WikiWeaver.Application.Exceptions;

public sealed class ValidationException : AppException
{
    public ValidationException(string message, string code = "validation_error")
        : base(message, 400, code)
    {
    }
}
