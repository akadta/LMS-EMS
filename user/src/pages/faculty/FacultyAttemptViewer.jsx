import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Hourglass, ShieldAlert, PenLine, ShieldCheck, CheckCircle2 } from "lucide-react";
import { facultyPortalApi } from "../../api/facultyPortalApi";
import FacultyProctoringReport from "../../components/faculty/FacultyProctoringReport";

export default function FacultyAttemptViewer() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
const [loading, setLoading] = useState(true);
const [overriding, setOverriding] = useState(false);
const [approving, setApproving] = useState(false);

  useEffect(() => {
    facultyPortalApi.getAttemptDetail(attemptId).then((res) => setDetail(res.data.data)).finally(() => setLoading(false));
  }, [attemptId]);

  const overrideUnlock = async () => {
  setOverriding(true);
  await facultyPortalApi.overrideUnlock(attemptId, true);
  const res = await facultyPortalApi.getAttemptDetail(attemptId);
  setDetail(res.data.data);
  setOverriding(false);
};

const approveInstant = async () => {
  setApproving(true);
  await facultyPortalApi.approveAttempt(attemptId, true);
  const res = await facultyPortalApi.getAttemptDetail(attemptId);
  setDetail(res.data.data);
  setApproving(false);
};

  if (loading || !detail)
    return <div style={{ color: "#9ca3af", fontSize: 13.5, maxWidth: 760, margin: "0 auto" }}>Loading...</div>;

  const pendingReview = detail.status === "grading";
  const failedBlocked = detail.status === "graded" && detail.passed === false;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={backBtnStyle}>
        <ArrowLeft size={15} /> Back to attempts
      </button>

      <div style={{ fontSize: 19, fontWeight: 800, color: "#111827" }}>{detail.assessmentName}</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>{detail.studentName}</div>

      {pendingReview && (
        <div style={bannerStyle("#fef3c7", "#d97706")}>
          <Hourglass size={14} />
          This attempt is awaiting faculty review.
          <button onClick={() => navigate(`/faculty/attempts/${attemptId}`)} style={grabLinkBtn}>
            <PenLine size={12} /> Grade now
          </button>
        </div>
      )}
    {failedBlocked && detail.alreadyOverridden && (
  <div style={bannerStyle("#dcfce7", "#16a34a")}>
    <ShieldCheck size={14} /> Student failed, but faculty override is applied — unlocked to progress.
  </div>
)}
{failedBlocked && !detail.alreadyOverridden && (
  <div style={bannerStyle("#fee2e2", "#dc2626")}>
    <ShieldAlert size={14} /> Student failed and is currently blocked from progressing.
    <button onClick={overrideUnlock} disabled={overriding} style={grabLinkBtn}>
      <ShieldCheck size={12} /> {overriding ? "Unlocking..." : "Override & Unlock"}
    </button>
  </div>
)}
{detail.status === "graded" && detail.mode === "instant" && !failedBlocked && (
  <div style={bannerStyle("#fef3c7", "#d97706")}>
    <Hourglass size={14} /> Awaiting faculty approval to unlock next step.
    <button onClick={approveInstant} disabled={approving} style={grabLinkBtn}>
      <CheckCircle2 size={12} /> {approving ? "Approving..." : "Approve & Unlock"}
    </button>
  </div>
)}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        {detail.answers.map((ans, i) => {
          const isOptionType = ans.questionType === "mcq_single" || ans.questionType === "mcq_multi";
          return (
            <div key={ans.answerId} style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{i + 1}. {ans.questionText}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                  {ans.markAwarded != null ? `${ans.markAwarded}/${ans.maxMark ?? "-"}` : `-/${ans.maxMark ?? "-"}`}
                </div>
              </div>

              {isOptionType ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {ans.options.map((o) => {
                    const wasSelected = ans.selectedOptionIds?.includes(o.id);
                    return (
                      <div key={o.id} style={{
                        fontSize: 12.5, padding: "6px 10px", borderRadius: 7,
                        background: o.isCorrect ? "#dcfce7" : wasSelected ? "#fee2e2" : "#f9fafb",
                        color: o.isCorrect ? "#16a34a" : wasSelected ? "#dc2626" : "#6b7280",
                      }}>
                        {o.optionText} {o.isCorrect && "✓"} {wasSelected && "(selected)"}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ background: "#f9fafb", borderRadius: 8, padding: 12, fontSize: 12.5, color: "#374151", whiteSpace: "pre-wrap" }}>
                  {ans.textAnswer || <span style={{ color: "#9ca3af" }}>No answer provided.</span>}
                </div>
              )}

              {ans.facultyNote && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280", background: "#f3f4f6", borderRadius: 7, padding: "7px 10px" }}>
                  <strong>Faculty note:</strong> {ans.facultyNote}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f0f0f0" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>Proctoring Report</div>
        <FacultyProctoringReport attemptId={attemptId} />
      </div>
    </div>
  );
}
function bannerStyle(bg, color) {
  return {
    display: "flex", alignItems: "center", gap: 8, background: bg, color, fontSize: 12.5,
    fontWeight: 600, padding: "10px 14px", borderRadius: 10, marginBottom: 4,
  };
}
const grabLinkBtn = {
  display: "flex", alignItems: "center", gap: 5, marginLeft: "auto", background: "#fff",
  border: "1px solid currentColor", borderRadius: 7, padding: "5px 10px", fontSize: 11.5,
  fontWeight: 700, cursor: "pointer", color: "inherit",
};
const backBtnStyle = {
  display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
  color: "#6b7280", fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0,
};