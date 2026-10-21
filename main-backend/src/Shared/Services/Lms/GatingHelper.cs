using dotnet.Data;
using dotnet.Models;
using Microsoft.EntityFrameworkCore;

namespace dotnet.Shared.Services;

public static class GatingHelper
{
    // Returns (unlocked, reasonIfBlocked)
    public static async Task<(bool unlocked, string? reason)> IsGateClearedAsync(
        AppDbContext context, int studentId, bool isFinalAssessment, bool isPass, bool isReviewUnlock, int? assessmentId)
    {
        if (!isFinalAssessment || assessmentId == null) return (true, null);

        var assessment = await context.Assessments.FindAsync(assessmentId.Value);
        if (assessment == null || !assessment.IsPublished || !assessment.IsActive) return (true, null); // no live gate

       var attempt = await context.AssessmentAttempts
    .Where(a => a.AssessmentId == assessmentId && a.StudentId == studentId && a.Status != "in_progress")
    .OrderByDescending(a => a.SubmittedAt).FirstOrDefaultAsync();

if (attempt == null) return (false, "not_attempted");

        if (assessment.Mode == "instant")
{
    if (isPass && attempt.Passed != true && !attempt.FacultyOverrideUnlock)
        return (false, "failed_pending_override");

    if (isReviewUnlock && attempt.Status != "approved")
        return (false, "pending_review");

    return (true, null);
}
else // review
{
    if (!isReviewUnlock) return (true, null);
    if (attempt.Status == "approved") return (true, null);
    return (false, "pending_review");
}
    }
}