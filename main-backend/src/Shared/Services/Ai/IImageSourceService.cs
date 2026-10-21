// using System.Net.Http.Headers;
// using System.Text.Json;

// namespace dotnet.Shared.Services;

// public interface IImageSourceService
// {
//     Task<string?> FindAndSaveImageAsync(string query, string folder, IFileStorageService fileStorage);
// }

// public class UnsplashImageService : IImageSourceService
// {
//     private readonly IHttpClientFactory _httpFactory;
//     private readonly IConfiguration _config;

//     public UnsplashImageService(IHttpClientFactory httpFactory, IConfiguration config)
//     {
//         _httpFactory = httpFactory;
//         _config = config;
//     }

//     public async Task<string?> FindAndSaveImageAsync(string query, string folder, IFileStorageService fileStorage)
//     {
//         var accessKey = _config["Unsplash:AccessKey"];
//         if (string.IsNullOrEmpty(accessKey)) return null;

//         var client = _httpFactory.CreateClient("unsplash");
//         client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Client-ID", accessKey);

//         var searchRes = await client.GetAsync($"search/photos?query={Uri.EscapeDataString(query)}&per_page=1&orientation=landscape");
//         if (!searchRes.IsSuccessStatusCode) return null;

//         var json = await searchRes.Content.ReadAsStringAsync();
//         using var doc = JsonDocument.Parse(json);
//         var results = doc.RootElement.GetProperty("results");
//         if (results.GetArrayLength() == 0) return null;

//         var imageUrl = results[0].GetProperty("urls").GetProperty("regular").GetString();
//         if (imageUrl == null) return null;

//         var imgRes = await client.GetAsync(imageUrl);
//         if (!imgRes.IsSuccessStatusCode) return null;

//         var bytes = await imgRes.Content.ReadAsByteArrayAsync();
//         var fileName = $"{Guid.NewGuid()}.jpg";
//         return await fileStorage.SaveBytesAsync(bytes, fileName, folder);
//     }
// }