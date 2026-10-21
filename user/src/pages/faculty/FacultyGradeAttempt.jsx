import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { facultyPortalApi } from "../../api/facultyPortalApi";

export default function FacultyGradeAttempt() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [marks, setMarks] = useState({});
  const [notes, setNotes] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    facultyPortalApi.getAttemptDetail(attemptId).then((res) => {
      const d = res.data.data;
      setDetail(d);
      const m = {},
        n = {};
      d.answers.forEach((a) => {
        m[a.answerId] = a.markAwarded ?? "";
        n[a.answerId] = a.facultyNote || "";
      });
      setMarks(m);
      setNotes(n);
    });
  };
  useEffect(() => {
    load();
  }, [attemptId]);

 const saveGrade = async (answerId) => {
    try {
      await facultyPortalApi.gradeAnswer(attemptId, answerId, {
        markAwarded: Number(marks[answerId]) || 0,
        facultyNote: notes[answerId],
      });
      setConfirmError("");
      load();
    } catch (err) {
      setConfirmError(err.response?.data?.errors?.[0] || "Failed to save mark.");
    }
};

 const [showResultModal, setShowResultModal] = useState(false);
const [resultData, setResultData] = useState(null);
const [confirmError, setConfirmError] = useState("");

const [showConfirmApprove, setShowConfirmApprove] = useState(false);

const validateAndSaveAll = async () => {
  const ungraded = detail.answers.filter((a) => marks[a.answerId] === "" || marks[a.answerId] == null);
  if (ungraded.length > 0) {
    setConfirmError(`Please enter a mark for all ${detail.answers.length} answer(s) before approving. ${ungraded.length} still missing.`);
    return false;
  }
  setConfirmError("");
  // save every answer's current mark/note to the server, so nothing typed-but-unsaved is lost
  setSaving(true);
  try {
    await Promise.all(
      detail.answers.map((a) =>
        facultyPortalApi.gradeAnswer(attemptId, a.answerId, {
          markAwarded: Number(marks[a.answerId]) || 0,
          facultyNote: notes[a.answerId],
        })
      )
    );
 } catch (err) {
    setSaving(false);
    setConfirmError(err.response?.data?.errors?.[0] || "Failed to save one or more marks. Please try again.");
    return false;
}
  setSaving(false);
  return true;
};

const requestApprove = async () => {
  const ok = await validateAndSaveAll();
  if (!ok) return;
  setShowConfirmApprove(true);
};

const finalizeApproval = async () => {
  setShowConfirmApprove(false);
  setSaving(true);
  const res = await facultyPortalApi.approveAttempt(attemptId, true);
  setSaving(false);
  setResultData({ approved: true, ...res.data.data });
  setShowResultModal(true);
};

  if (!detail)
    return (
      <div
        style={{
          color: "#9ca3af",
          fontSize: 13.5,
          maxWidth: 700,
          margin: "0 auto",
        }}
      >
        Loading...
      </div>
    );

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <button
        onClick={() => navigate("/faculty/review-queue")}
        style={backBtnStyle}
      >
        <ArrowLeft size={15} /> Back to queue
      </button>
      <div style={{ fontSize: 19, fontWeight: 800, color: "#111827" }}>
        {detail.assessmentName}
      </div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        {detail.studentName}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {detail.answers.map((a) => {
          const isOptionType =
            a.questionType === "mcq_single" || a.questionType === "mcq_multi";
          return (
            <div
              key={a.answerId}
              style={{
                background: "#fff",
                borderRadius: 14,
                border: "1px solid #f0f0f0",
                padding: 18,
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 10,
                }}
              >
                {a.questionText}
              </div>

              {isOptionType ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    marginBottom: 12,
                  }}
                >
                  {a.options.map((o) => {
                    const wasSelected = a.selectedOptionIds?.includes(o.id);
                    return (
                      <div
                        key={o.id}
                        style={{
                          fontSize: 12.5,
                          padding: "6px 10px",
                          borderRadius: 8,
                          background: o.isCorrect
                            ? "#dcfce7"
                            : wasSelected
                              ? "#fee2e2"
                              : "#f9fafb",
                          color: o.isCorrect
                            ? "#16a34a"
                            : wasSelected
                              ? "#dc2626"
                              : "#6b7280",
                        }}
                      >
                        {o.optionText} {o.isCorrect && "✓"}{" "}
                        {wasSelected && "(selected)"}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    background: "#f9fafb",
                    borderRadius: 10,
                    padding: 14,
                    fontSize: 13,
                    color: "#374151",
                    marginBottom: 12,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {a.textAnswer || (
                    <span style={{ color: "#9ca3af" }}>
                      No answer provided.
                    </span>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
               <input
  type="number"
  min="0"
  max={a.maxMark || undefined}
  value={marks[a.answerId] ?? ""}
  onChange={(e) => {
    let val = e.target.value;
    if (val !== "" && a.maxMark != null) {
      const num = Number(val);
      if (num > a.maxMark) val = String(a.maxMark);
      if (num < 0) val = "0";
    }
    setMarks((m) => ({ ...m, [a.answerId]: val }));
  }}
  placeholder="Mark"
  style={{
    width: 80,
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 13,
  }}
/>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  / {a.maxMark ?? "-"}
                </span>
                <input
                  value={notes[a.answerId] ?? ""}
                  onChange={(e) =>
                    setNotes((n) => ({ ...n, [a.answerId]: e.target.value }))
                  }
                  placeholder="Note (optional)"
                  style={{
                    flex: 1,
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "7px 10px",
                    fontSize: 12.5,
                  }}
                />
                <button
                  onClick={() => saveGrade(a.answerId)}
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "7px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          );
        })}
      </div>

    <button
  onClick={requestApprove}
  disabled={saving}
  style={{
    width: "100%",
    padding: "12px",
    borderRadius: 10,
    border: "none",
    background: "var(--accent)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  }}
>
  <CheckCircle2 size={15} /> {saving ? "Checking..." : "Approve & Unlock"}
</button>


      {confirmError && (
  <div style={{ background: "#fef2f2", color: "#dc2626", fontSize: 12.5, padding: "9px 12px", borderRadius: 8, marginTop: 10 }}>
    {confirmError}
  </div>
)}

{showResultModal && resultData && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(15,15,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}>
    <div style={{ background: "#fff", borderRadius: 18, width: 420, padding: 26, textAlign: "center" }}>
      <CheckCircle2 size={32} color={resultData.approved ? "#16a34a" : "#6b7280"} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
        {resultData.approved ? "Approved & Unlocked" : "Saved — Not Approved Yet"}
      </div>
      {resultData.percent != null && (
        <div style={{ fontSize: 13.5, color: "#6b7280", marginTop: 8 }}>
          {resultData.totalAwarded}/{resultData.totalPossible} marks ({resultData.percent}%)
          {resultData.grade && ` · Grade ${resultData.grade}`}
          {resultData.passed != null && (resultData.passed ? " · Passed" : " · Not Passed")}
        </div>
      )}
      {!resultData.approved && (
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 10, lineHeight: 1.5 }}>
          You can come back and re-grade or approve this attempt anytime before it's approved.
        </div>
      )}
      <button
        onClick={() => navigate("/faculty/review-queue")}
        style={{ marginTop: 18, width: "100%", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
      >
        Back to Queue
      </button>
    </div>
  </div>
)}
{showConfirmApprove && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(15,15,20,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 350, padding: 16 }}>
    <div style={{ background: "#fff", borderRadius: 18, width: 440, padding: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <AlertTriangle size={22} color="#d97706" />
        <div style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>Confirm Approval</div>
      </div>
      <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 8 }}>
        You are about to approve this attempt and unlock the student's progress. This will:
      </div>
      <ul style={{ fontSize: 12.5, color: "#374151", lineHeight: 1.8, marginBottom: 18, paddingLeft: 18 }}>
        <li>Finalize marks for all {detail.answers.length} question(s)</li>
        <li>Calculate the final percent, pass/fail, and grade</li>
        <li>Unlock the student's next module/chapter</li>
        <li>This action cannot be undone once approved</li>
      </ul>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => setShowConfirmApprove(false)}
          style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          Cancel
        </button>
       <button
  onClick={finalizeApproval}
  style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
>
  Yes, Approve
</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}

const backBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "none",
  border: "none",
  color: "#6b7280",
  fontSize: 13,
  cursor: "pointer",
  marginBottom: 14,
  padding: 0,
};
