namespace WikiWeaver.Application.Exceptions;

public abstract class AppException : Exception
{
    protected AppException(string message, int statusCode, string code)
        : base(message)
    {
        StatusCode = statusCode;
        Code = code;
    }

    public int StatusCode { get; }

    public string Code { get; }
}
