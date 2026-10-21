import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Hourglass } from "lucide-react";
import { studentLearningApi } from "../../api/studentLearningApi";

export default function StudentAttemptDetail() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    studentLearningApi.getAttemptDetail(attemptId)
      .then((res) => setDetail(res.data.data))
      .catch((err) => setError(err.response?.data?.errors?.[0] || "Could not load this attempt."));
  }, [attemptId]);

  if (error) return <div style={{ maxWidth: 760, margin: "0 auto", color: "#dc2626", fontSize: 13.5 }}>{error}</div>;
  if (!detail) return <div style={{ maxWidth: 760, margin: "0 auto", color: "#9ca3af", fontSize: 13.5 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={backBtnStyle}>
        <ArrowLeft size={15} /> Back
      </button>

      <div style={{ fontSize: 19, fontWeight: 800, color: "#111827" }}>{detail.assessmentName}</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Your attempt</div>

      {!detail.revealAnswers && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef3c7", color: "#d97706", fontSize: 12.5, fontWeight: 600, padding: "10px 14px", borderRadius: 10, marginBottom: 16 }}>
          <Hourglass size={14} /> This attempt is still being reviewed — marks and correct answers will appear once faculty finishes grading.
        </div>
      )}

      {detail.revealAnswers && detail.totalPossible != null && (
        <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--accent)" }}>{detail.percent}%</div>
          <div style={{ fontSize: 12.5, color: "#6b7280" }}>
            {detail.totalAwarded}/{detail.totalPossible} marks
            {detail.grade && ` · Grade ${detail.grade}`}
            {detail.passed != null && (detail.passed ? " · Passed" : " · Not Passed")}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {detail.answers.map((ans, i) => {
          const isOptionType = ans.questionType === "mcq_single" || ans.questionType === "mcq_multi";
          return (
            <div key={ans.answerId} style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{i + 1}. {ans.questionText}</div>
                {detail.revealAnswers && (
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                    {ans.markAwarded != null ? `${ans.markAwarded}/${ans.maxMark ?? "-"}` : `-/${ans.maxMark ?? "-"}`}
                  </div>
                )}
              </div>

              {isOptionType ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {ans.options.map((o) => {
                    const wasSelected = ans.selectedOptionIds?.includes(o.id);
                    const bg = detail.revealAnswers
                      ? (o.isCorrect ? "#dcfce7" : wasSelected ? "#fee2e2" : "#f9fafb")
                      : (wasSelected ? "rgba(var(--accent-rgb),0.08)" : "#f9fafb");
                    const color = detail.revealAnswers
                      ? (o.isCorrect ? "#16a34a" : wasSelected ? "#dc2626" : "#6b7280")
                      : "#374151";
                    return (
                      <div key={o.id} style={{ fontSize: 12.5, padding: "6px 10px", borderRadius: 7, background: bg, color }}>
                        {o.optionText} {detail.revealAnswers && o.isCorrect && "✓"} {wasSelected && "(your answer)"}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ background: "#f9fafb", borderRadius: 8, padding: 12, fontSize: 12.5, color: "#374151", whiteSpace: "pre-wrap" }}>
                  {ans.textAnswer || <span style={{ color: "#9ca3af" }}>No answer provided.</span>}
                </div>
              )}

              {detail.revealAnswers && ans.facultyNote && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280", background: "#f3f4f6", borderRadius: 7, padding: "7px 10px" }}>
                  <strong>Faculty note:</strong> {ans.facultyNote}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const backBtnStyle = {
  display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
  color: "#6b7280", fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0,
};