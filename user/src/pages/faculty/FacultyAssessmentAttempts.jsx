import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { facultyPortalApi } from "../../api/facultyPortalApi";
import { StatusPill } from "./FacultyStudentOverview";

export default function FacultyAssessmentAttempts() {
  const { studentId, assessmentId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    facultyPortalApi
      .getAssessmentAttemptsForStudent(studentId, assessmentId)
      .then((res) => setSummary(res.data.data))
      .finally(() => setLoading(false));
  }, [studentId, assessmentId]);

  if (loading || !summary)
    return <div style={{ color: "#9ca3af", fontSize: 13.5, maxWidth: 800, margin: "0 auto" }}>Loading...</div>;

const statusOf = (a) => {
  if (a.status === "grading") return "pending_review";
  if (a.status === "approved") return "approved";
  if (a.passed === false) return a.facultyOverrideUnlock ? "passed" : "failed_blocked";
  if (a.passed === true) return "passed";
  return "graded_not_approved";
};
  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={backBtnStyle}>
        <ArrowLeft size={15} /> Back
      </button>

      <div style={{ fontSize: 19, fontWeight: 800, color: "#111827" }}>{summary.assessmentName}</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, textTransform: "capitalize" }}>
        {summary.mode === "instant" ? "Instant Result" : "Result After Review"} · {summary.attempts.length} attempt(s)
      </div>

      {summary.attempts.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13.5, border: "1px solid #f0f0f0" }}>
          Not attempted yet.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {summary.attempts.map((a, idx) => (
          <div
            key={a.attemptId}
            onClick={() => navigate(`/faculty/attempts/${a.attemptId}/view`)}
            style={{
              background: "#fff",
              border: "1px solid #f0f0f0",
              borderRadius: 12,
              padding: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>
                Attempt {summary.attempts.length - idx}
              </div>
              <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 3 }}>
                Started {new Date(a.startedAt).toLocaleString()} · Submitted {new Date(a.submittedAt).toLocaleString()}
              </div>
              {a.reviewedAt && (
                <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>
                  Reviewed {new Date(a.reviewedAt).toLocaleString()}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {a.totalPossible != null && (
                <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>
                  {a.totalAwarded}/{a.totalPossible} ({a.percent}%)
                </span>
              )}
              {a.grade && <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>Grade {a.grade}</span>}
<div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
  <StatusPill status={statusOf(a)} />
  {a.passed === false && a.facultyOverrideUnlock && (
    <span style={{ fontSize: 9.5, color: "#d97706", fontWeight: 600 }}>Override applied</span>
  )}
</div>            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const backBtnStyle = {
  display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
  color: "#6b7280", fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0,
};