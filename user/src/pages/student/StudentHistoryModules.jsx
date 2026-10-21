import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronRight, CheckCircle2, Circle, Sparkles, Hourglass, ShieldAlert, ShieldCheck } from "lucide-react";
import { studentLearningApi } from "../../api/studentLearningApi";

export default function StudentHistoryModules() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    studentLearningApi.getHistoryModules(courseId).then((res) => setModules(res.data.data || []));
  }, [courseId]);

  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  if (!modules) return <div style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 840, margin: "0 auto" }}>
      <button onClick={() => navigate("/student/history")} style={backBtnStyle}>
        <ArrowLeft size={15} /> Back to history
      </button>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 20 }}>Course Progress & Marks</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {modules.map((m) => (
          <div key={m.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", overflow: "hidden" }}>
            <div onClick={() => toggle(m.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, cursor: "pointer" }}>
              {expanded[m.id] ? <ChevronDown size={15} color="#9ca3af" /> : <ChevronRight size={15} color="#9ca3af" />}
              {m.completed ? <CheckCircle2 size={16} color="#16a34a" /> : <Circle size={16} color="#d1d5db" />}
              <span style={{ fontSize: 14, fontWeight: 700, color: "#111827", flex: 1 }}>{m.name}</span>
              {m.hasGate && <Sparkles size={13} color="var(--accent)" />}
            </div>

            {expanded[m.id] && (
              <div style={{ padding: "0 14px 14px 34px", display: "flex", flexDirection: "column", gap: 10 }}>
{m.assessment && <AssessmentHistory label="Module Assessment" summary={m.assessment} navigate={navigate} />}
                {m.chapters.map((c) => (
                  <div key={c.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", borderRadius: 8, padding: "8px 12px" }}>
                      {c.completed ? <CheckCircle2 size={14} color="#16a34a" /> : <Circle size={14} color="#d1d5db" />}
                      <span style={{ fontSize: 12.5, color: "#374151", flex: 1 }}>{c.name}</span>
                      {c.completedAt && <span style={{ fontSize: 10.5, color: "#9ca3af" }}>{new Date(c.completedAt).toLocaleDateString()}</span>}
                    </div>
                    {c.assessment && (
                      <div style={{ marginLeft: 10, marginTop: 6 }}>
<AssessmentHistory label="Chapter Assessment" summary={c.assessment} compact navigate={navigate} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AssessmentHistory({ label, summary, compact,navigate}) {
  if (summary.attempts.length === 0) {
    return <div style={{ fontSize: 11.5, color: "#9ca3af" }}>{label}: not attempted yet</div>;
  }
  return (
    <div>
      <div style={{ fontSize: compact ? 11 : 12, fontWeight: 700, color: "#374151", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
        <Sparkles size={compact ? 11 : 12} color="var(--accent)" /> {label} — {summary.assessmentName}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {summary.attempts.map((a, idx) => (
  <div
    key={a.attemptId}
    onClick={() => navigate(`/student/history/attempts/${a.attemptId}`)}
    style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: 9, padding: compact ? "8px 10px" : "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", cursor: "pointer" }}
  >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AttemptStatusTag attempt={a} />
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                Attempt {summary.attempts.length - idx} · {new Date(a.submittedAt).toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {a.totalPossible != null && (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>
                  {a.totalAwarded}/{a.totalPossible} ({a.percent}%)
                </span>
              )}
              {a.grade && <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>Grade {a.grade}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttemptStatusTag({ attempt }) {
  if (attempt.status === "grading")
    return <span style={pill("#fef3c7", "#d97706")}><Hourglass size={11} /> Pending Review</span>;
  if (attempt.status === "approved")
    return <span style={pill("#dcfce7", "#16a34a")}><ShieldCheck size={11} /> Approved</span>;
  if (attempt.passed === false)
    return attempt.facultyOverrideUnlock
      ? <span style={pill("#dcfce7", "#16a34a")}><ShieldCheck size={11} /> Passed (Override)</span>
      : <span style={pill("#fee2e2", "#dc2626")}><ShieldAlert size={11} /> Failed</span>;
  if (attempt.passed === true)
    return <span style={pill("#dcfce7", "#16a34a")}><CheckCircle2 size={11} /> Passed</span>;
  return <span style={pill("#f3f4f6", "#6b7280")}>{attempt.status}</span>;
}

function pill(bg, color) {
  return { display: "flex", alignItems: "center", gap: 4, background: bg, color, fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999 };
}

const backBtnStyle = {
  display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
  color: "#6b7280", fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0,
};