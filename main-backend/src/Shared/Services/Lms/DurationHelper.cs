namespace dotnet.Shared.Services;

public static class DurationHelper
{
    public static int ToDays(int? value, string? unit)
    {
        if (value == null || value <= 0 || string.IsNullOrEmpty(unit)) return 0;
        return unit.ToLower() switch
        {
            "day" => value.Value,
            "week" => value.Value * 7,
            "month" => value.Value * 30,
            "year" => value.Value * 365,
            _ => 0
        };
    }

    public static string Label(int? value, string? unit)
    {
        if (value == null || value <= 0 || string.IsNullOrEmpty(unit)) return "-";
        var u = unit.ToLower();
        var plural = value == 1 ? u : u + "s";
        return $"{value} {plural}";
    }
}