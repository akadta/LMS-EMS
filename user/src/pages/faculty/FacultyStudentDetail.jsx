import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Hourglass,
} from "lucide-react";
import { facultyPortalApi } from "../../api/facultyPortalApi";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

export default function FacultyStudentDetail() {
  const { batchCourseId, studentId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    facultyPortalApi
      .getStudentFullReport(studentId, batchCourseId)
      .then((res) => setReport(res.data.data))
      .finally(() => setLoading(false));
  }, [studentId, batchCourseId]);

  const toggleModule = (id) =>
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));

  if (loading || !report)
    return (
      <div style={{ color: "#9ca3af", fontSize: 13.5, maxWidth: 820, margin: "0 auto" }}>
        Loading...
      </div>
    );

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={backBtnStyle}>
        <ArrowLeft size={15} /> Back to student list
      </button>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #f0f0f0",
          padding: 22,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {report.photoUrl ? (
          <img
            src={resolveImageUrl(report.photoUrl)}
            alt=""
            style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f3f4f6" }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{report.name}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{report.courseName}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>
            {report.modulesCompleted}/{report.totalModules}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>modules completed</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {report.modules.map((m) => (
          <div
            key={m.id}
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #f0f0f0",
              overflow: "hidden",
            }}
          >
            <div
              onClick={() => toggleModule(m.id)}
              style={{
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
              }}
            >
              {expandedModules[m.id] ? (
                <ChevronDown size={16} color="#9ca3af" />
              ) : (
                <ChevronRight size={16} color="#9ca3af" />
              )}
              {m.completed ? (
                <CheckCircle2 size={18} color="#16a34a" />
              ) : (
                <Circle size={18} color="#d1d5db" />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "#111827" }}>{m.name}</div>
                <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>
                  {m.chapters.length} chapter(s)
                  {m.hasGate && " · Has final assessment"}
                </div>
              </div>
              {m.hasGate && <Sparkles size={14} color="var(--accent)" />}
            </div>

            {expandedModules[m.id] && (
              <div style={{ borderTop: "1px solid #f3f4f6", padding: "4px 16px 16px" }}>
                {m.assessment && (
                  <AssessmentBlock summary={m.assessment} label="Module Final Assessment" />
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: m.assessment ? 14 : 8 }}>
                  {m.chapters.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        background: "#f9fafb",
                        borderRadius: 10,
                        padding: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {c.completed ? (
                          <CheckCircle2 size={15} color="#16a34a" />
                        ) : (
                          <Circle size={15} color="#d1d5db" />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                            {c.name}
                          </div>
                          {c.completedAt && (
                            <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 1 }}>
                              Completed {new Date(c.completedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                        {c.hasGate && <Sparkles size={12} color="var(--accent)" />}
                      </div>
                      {c.assessment && (
                        <div style={{ marginTop: 10 }}>
                          <AssessmentBlock summary={c.assessment} label="Chapter Assessment" compact />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AssessmentBlock({ summary, label, compact }) {
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  const toggleAttempt = async (attemptId) => {
    if (expandedAttempt === attemptId) {
      setExpandedAttempt(null);
      return;
    }
    setExpandedAttempt(attemptId);
    if (!detailCache[attemptId]) {
      setLoadingId(attemptId);
      const res = await facultyPortalApi.getAttemptDetail(attemptId);
      setDetailCache((prev) => ({ ...prev, [attemptId]: res.data.data }));
      setLoadingId(null);
    }
  };

  if (summary.attempts.length === 0) {
    return (
      <div
        style={{
          fontSize: 11.5,
          color: "#9ca3af",
          background: "#fff",
          border: "1px dashed #e5e7eb",
          borderRadius: 8,
          padding: "8px 10px",
        }}
      >
        {label}: not attempted yet
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          fontSize: compact ? 11 : 12,
          fontWeight: 700,
          color: "#374151",
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <Sparkles size={compact ? 11 : 12} color="var(--accent)" /> {label} — {summary.assessmentName}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {summary.attempts.map((a, idx) => (
          <div
            key={a.attemptId}
            style={{
              background: "#fff",
              border: "1px solid #f0f0f0",
              borderRadius: 9,
              overflow: "hidden",
            }}
          >
            <div
              onClick={() => toggleAttempt(a.attemptId)}
              style={{
                padding: compact ? "8px 10px" : "10px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                flexWrap: "wrap",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {expandedAttempt === a.attemptId ? (
                  <ChevronDown size={13} color="#9ca3af" />
                ) : (
                  <ChevronRight size={13} color="#9ca3af" />
                )}
                <StatusTag status={a.status} passed={a.passed} />
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
                {a.grade && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)" }}>
                    Grade {a.grade}
                  </span>
                )}
                {a.facultyOverrideUnlock && (
                  <span style={{ fontSize: 10.5, color: "#d97706", fontWeight: 600 }}>
                    Override applied
                  </span>
                )}
              </div>
            </div>

            {expandedAttempt === a.attemptId && (
              <div style={{ borderTop: "1px solid #f3f4f6", padding: 12, background: "#fafafa" }}>
                {loadingId === a.attemptId && (
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>Loading answers...</div>
                )}
                {detailCache[a.attemptId] && (
                  <AttemptAnswersReadOnly detail={detailCache[a.attemptId]} attemptMeta={a} />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusTag({ status, passed }) {
  if (status === "grading")
    return (
      <span style={pill("#fef3c7", "#d97706")}>
        <Hourglass size={11} /> Grading
      </span>
    );
  if (status === "approved")
    return (
      <span style={pill("#dcfce7", "#16a34a")}>
        <ShieldCheck size={11} /> Approved
      </span>
    );
  if (status === "graded" && passed === false)
    return (
      <span style={pill("#fee2e2", "#dc2626")}>
        <ShieldAlert size={11} /> Failed
      </span>
    );
  if (status === "graded" && passed === true)
    return (
      <span style={pill("#dcfce7", "#16a34a")}>
        <CheckCircle2 size={11} /> Passed
      </span>
    );
  return <span style={pill("#f3f4f6", "#6b7280")}>{status}</span>;
}


function AttemptAnswersReadOnly({ detail, attemptMeta }) {
  const pendingReview = attemptMeta.status === "grading";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {pendingReview && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: "#fef3c7",
            color: "#d97706",
            fontSize: 11.5,
            fontWeight: 600,
            padding: "8px 10px",
            borderRadius: 8,
          }}
        >
          <Hourglass size={13} /> This attempt is still awaiting faculty review — marks below are provisional/unset until approved.
        </div>
      )}
      {attemptMeta.status === "graded" && attemptMeta.passed === false && !attemptMeta.facultyOverrideUnlock && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: "#fee2e2",
            color: "#dc2626",
            fontSize: 11.5,
            fontWeight: 600,
            padding: "8px 10px",
            borderRadius: 8,
          }}
        >
          <ShieldAlert size={13} /> Student failed this attempt and is currently blocked from progressing (no override applied).
        </div>
      )}

      {detail.answers.map((ans, i) => {
        const isOptionType = ans.questionType === "mcq_single" || ans.questionType === "mcq_multi";
        return (
          <div
            key={ans.answerId}
            style={{
              background: "#fff",
              border: "1px solid #f0f0f0",
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "#111827" }}>
                {i + 1}. {ans.questionText}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                {ans.markAwarded != null ? `${ans.markAwarded}/${ans.maxMark ?? "-"}` : `-/${ans.maxMark ?? "-"}`}
              </div>
            </div>

            {isOptionType ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {ans.options.map((o) => {
                  const wasSelected = ans.selectedOptionIds?.includes(o.id);
                  return (
                    <div
                      key={o.id}
                      style={{
                        fontSize: 12,
                        padding: "5px 9px",
                        borderRadius: 7,
                        background: o.isCorrect ? "#dcfce7" : wasSelected ? "#fee2e2" : "#f9fafb",
                        color: o.isCorrect ? "#16a34a" : wasSelected ? "#dc2626" : "#6b7280",
                      }}
                    >
                      {o.optionText} {o.isCorrect && "✓"} {wasSelected && !o.isCorrect && "(selected)"}
                      {wasSelected && o.isCorrect && " (selected)"}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  background: "#f9fafb",
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 12,
                  color: "#374151",
                  whiteSpace: "pre-wrap",
                }}
              >
                {ans.textAnswer || <span style={{ color: "#9ca3af" }}>No answer provided.</span>}
              </div>
            )}

            {ans.facultyNote && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11.5,
                  color: "#6b7280",
                  background: "#f3f4f6",
                  borderRadius: 6,
                  padding: "6px 9px",
                }}
              >
                <strong>Faculty note:</strong> {ans.facultyNote}
              </div>
            )}
          </div>
        );
      })}

      {pendingReview && (
        <a
          href={`/faculty/attempts/${attemptMeta.attemptId}`}
          style={{
            display: "inline-block",
            marginTop: 4,
            fontSize: 12,
            fontWeight: 700,
            color: "var(--accent)",
            textDecoration: "none",
          }}
        >
          Go grade this attempt →
        </a>
      )}
    </div>
  );
}

function pill(bg, color) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 4,
    background: bg,
    color,
    fontSize: 10.5,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 999,
  };
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