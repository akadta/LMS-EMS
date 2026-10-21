namespace dotnet.Shared.Services;

public class FileStorageService : IFileStorageService
{
    private readonly string _basePath;

    public FileStorageService(string basePath)
    {
        _basePath = basePath;
    }

    public async Task<string> SaveFileAsync(IFormFile file, string relativeFolder)
    {
        var folderPath = Path.Combine(_basePath, relativeFolder);
        Directory.CreateDirectory(folderPath);

        var ext = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{ext}";
        var fullPath = Path.Combine(folderPath, fileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return Path.Combine(relativeFolder, fileName).Replace("\\", "/");
    }

    public async Task<string> SaveBytesAsync(byte[] bytes, string fileName, string relativeFolder)
{
    var folderPath = Path.Combine(_basePath, relativeFolder);
    Directory.CreateDirectory(folderPath);

    var fullPath = Path.Combine(folderPath, fileName);
    await File.WriteAllBytesAsync(fullPath, bytes);

    return Path.Combine(relativeFolder, fileName).Replace("\\", "/");
}

    public void DeleteFile(string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath)) return;

        var fullPath = Path.Combine(_basePath, relativePath);
        if (File.Exists(fullPath)) File.Delete(fullPath);
    }

    
}