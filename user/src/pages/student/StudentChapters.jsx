import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  FileText,
  Sparkles,
} from "lucide-react";
import { studentLearningApi } from "../../api/studentLearningApi";
import { GateStatus } from "./StudentModules";

export default function StudentChapters() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
const [searchParams] = useSearchParams();
const courseId = searchParams.get("courseId");
const batchId = searchParams.get("batchId");

  const load = () => {
    setLoading(true);
    studentLearningApi
      .getChapters(moduleId)
      .then((res) => setChapters(res.data.data || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, [moduleId]);

  useEffect(() => {
    if (chapters.length === 0) return;
    const allDone = chapters.every(
      (c) => c.completed && (!c.hasGate || c.gateCleared),
    );
    if (allDone) {
      studentLearningApi.completeModule(moduleId);
    }
  }, [chapters, moduleId]);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
    <button
  onClick={() => navigate(courseId ? `/student/courses/${courseId}/modules${batchId ? `?batchId=${batchId}` : ""}` : "/student/batches")}
  style={backBtnStyle}
>
  <ArrowLeft size={15} /> Back to modules
</button>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#111827",
          marginBottom: 20,
        }}
      >
        Chapters
      </div>

      {loading && (
        <div style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {chapters.map((c) => {
          const fullyDone = c.completed && (!c.hasGate || c.gateCleared);
          const showAssessmentBlock =
            c.completed && c.hasGate && !c.gateCleared;

          return (
            <div
              key={c.id}
              style={{
                background: "#fff",
                borderRadius: 14,
                border: "1px solid #f0f0f0",
                padding: 15,
                opacity: c.unlocked ? 1 : 0.55,
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: fullyDone
                      ? "#dcfce7"
                      : c.unlocked
                        ? "rgba(var(--accent-rgb),0.12)"
                        : "#f3f4f6",
                  }}
                >
                  {fullyDone ? (
                    <CheckCircle2 size={17} color="#16a34a" />
                  ) : c.unlocked ? (
                    <FileText size={15} color="var(--accent)" />
                  ) : (
                    <Lock size={14} color="#9ca3af" />
                  )}
                </div>
                <div
               onClick={() =>
  c.unlocked &&
  navigate(`/student/chapters/${c.id}?moduleId=${moduleId}${courseId ? `&courseId=${courseId}` : ""}${batchId ? `&batchId=${batchId}` : ""}`)
}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    cursor: c.unlocked ? "pointer" : "not-allowed",
                  }}
                >
                  <div
                    style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}
                  >
                    {c.name}
                  </div>
                  {!c.unlocked && (
                    <div
                      style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}
                    >
                      Complete the previous chapter to unlock
                    </div>
                  )}
                </div>
                {c.hasGate && <Sparkles size={13} color="var(--accent)" />}
              </div>
              {showAssessmentBlock && (
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px solid #f3f4f6",
                  }}
                >
            <GateStatus
  reason={c.gateBlockReason}
  assessmentId={c.assessmentId}
  navigate={navigate}
  entityType="chapter"
  entityId={c.id}
  moduleId={moduleId}
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
