using dotnet.Test.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace dotnet.Test.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly ITestService _testService;
    public TestController(ITestService testService)
    {
        _testService = testService;
    }

    [HttpGet]
    public async Task<IActionResult> Test()
    {
        var result = await _testService.Test();

        return Ok(result);
    }
}