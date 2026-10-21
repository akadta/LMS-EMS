namespace dotnet.Shared.Common;

public class ServiceResult<T>
{
    public T? Data { get; set; }

    public bool Success { get; set; }

    public List<string> Errors { get; set; } = new();
}