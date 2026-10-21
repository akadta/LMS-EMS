namespace dotnet.Shared.Services;

public static class LabelFormatHelper
{
    // 0-based index -> label. Alpha overflows a,b,...z,aa,ab,...
    public static string Label(int index, string format)
    {
        if (format == "alpha_upper") return AlphaLabel(index).ToUpper();
        if (format == "alpha_lower") return AlphaLabel(index);
        return (index + 1).ToString(); // numeric
    }

    private static string AlphaLabel(int index)
    {
        var result = "";
        index++;
        while (index > 0)
        {
            var rem = (index - 1) % 26;
            result = (char)('a' + rem) + result;
            index = (index - 1) / 26;
        }
        return result;
    }
}