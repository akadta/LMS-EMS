namespace dotnet.Shared.Services;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(IFormFile file, string relativeFolder);
    Task<string> SaveBytesAsync(byte[] bytes, string fileName, string relativeFolder);
    void DeleteFile(string? relativePath);
}