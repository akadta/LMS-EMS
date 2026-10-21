import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ShieldAlert,
  Hourglass,
} from "lucide-react";
import { studentLearningApi } from "../../api/studentLearningApi";
import { resolveImageUrl } from "../../utils/resolveImageUrl";


export default function StudentModules() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
const batchId = searchParams.get("batchId");

  const load = () => {
    setLoading(true);
    studentLearningApi
      .getModules(courseId)
      .then((res) =>
        setModules(
          (res.data.data || []).map((m) => ({
            ...m,
            imageUrl: resolveImageUrl(m.imageUrl),
          })),
        ),
      )
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, [courseId]);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
     <button
  onClick={() => navigate(batchId ? `/student/batches/${batchId}` : "/student/batches")}
  style={backBtnStyle}
>
  <ArrowLeft size={15} /> Back to courses
</button>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#111827",
          marginBottom: 20,
        }}
      >
        Course Modules
      </div>

      {loading && (
        <div style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {modules.map((m, idx) => {
          const canOpen = m.unlocked && m.completed ? true : m.unlocked;
          const showAssessmentBlock =
            m.completed && m.hasGate && !m.gateCleared;

          return (
            <div
              key={m.id}
              style={{
                background: "#fff",
                borderRadius: 14,
                border: "1px solid #f0f0f0",
                padding: 16,
                opacity: m.unlocked ? 1 : 0.55,
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background:
                      m.completed && (!m.hasGate || m.gateCleared)
                        ? "#dcfce7"
                        : m.unlocked
                          ? "rgba(var(--accent-rgb),0.12)"
                          : "#f3f4f6",
                  }}
                >
                  {m.completed && (!m.hasGate || m.gateCleared) ? (
                    <CheckCircle2 size={20} color="#16a34a" />
                  ) : m.unlocked ? (
                    <BookOpen size={18} color="var(--accent)" />
                  ) : (
                    <Lock size={16} color="#9ca3af" />
                  )}
                </div>
                <div
                onClick={() =>
m.unlocked && navigate(`/student/modules/${m.id}/chapters?courseId=${courseId}${batchId ? `&batchId=${batchId}` : ""}`)
}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    cursor: m.unlocked ? "pointer" : "not-allowed",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14.5,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    {m.name}
                  </div>
                  <div
                    style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}
                  >
                    {!m.unlocked
                      ? "Complete the previous module to unlock"
                      : `${m.chapterCount} chapters`}
                  </div>
                </div>
                {m.hasGate && <Sparkles size={14} color="var(--accent)" />}
              </div>

              {showAssessmentBlock && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid #f3f4f6",
                  }}
                >
                 <GateStatus
  reason={m.gateBlockReason}
  assessmentId={m.assessmentId}
  navigate={navigate}
  entityType="module"
  entityId={m.id}
  courseId={courseId}
/>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GateStatus({
  reason,
  assessmentId,
  navigate,
  entityType,
  entityId,
  moduleId,
  courseId,
}) {
  if (reason === "not_attempted") {
    return (
      <button
        onClick={() =>
          navigate(
            `/student/assessment/${assessmentId}?entityType=${entityType}&entityId=${entityId}${moduleId ? `&moduleId=${moduleId}` : ""}${courseId ? `&courseId=${courseId}` : ""}`
          )
        }
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          background: "var(--accent)",
          color: "#fff",
          border: "none",
          borderRadius: 9,
          padding: "9px 14px",
          fontSize: 12.5,
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        <Sparkles size={13} /> Take Assessment
      </button>
    );
  }
  if (reason === "failed_pending_override") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          color: "#dc2626",
          fontSize: 12.5,
          fontWeight: 600,
        }}
      >
        <ShieldAlert size={14} /> Assessment failed — awaiting faculty approval
        to continue
      </div>
    );
  }
  if (reason === "pending_review") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          color: "#d97706",
          fontSize: 12.5,
          fontWeight: 600,
        }}
      >
        <Hourglass size={14} /> Submitted — awaiting faculty review
      </div>
    );
  }
  return null;
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
