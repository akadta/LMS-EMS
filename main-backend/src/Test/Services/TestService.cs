using dotnet.Test.Interfaces;

namespace dotnet.Test.Services;

public class TestService : ITestService
{
    public async Task<string> Test()
    {
        return "hello";
    }
}