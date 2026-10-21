import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Lock,
  Sparkles,
  ArrowLeft,
  Pencil,
  BookOpen,
} from "lucide-react";
import { courseApi } from "../../api/courseApi";
import ModuleFormModal from "./ModuleFormModal";
import AssessmentEntryButton from "../../components/assessments/AssessmentEntryButton";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import AiCourseBuilderModal from "../../components/courses/AiCourseBuilderModal";

export default function ModuleList() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null); // "create" | moduleId
  const [showAiModules, setShowAiModules] = useState(false);

  const load = () => {
    setLoading(true);
    courseApi
      .listModules(courseId)
      .then((res) => {
        setCourse(res.data.data.course);
        const mods = (res.data.data.modules || []).map((m) => ({
          ...m,
          imageUrl: resolveImageUrl(m.imageUrl),
        }));
        setModules(mods);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [courseId]);

  return (
    <div>
      <button onClick={() => navigate("/courses")} style={backBtnStyle}>
        <ArrowLeft size={15} /> Back to courses
      </button>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
            {course?.name || "Modules"}
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
            Manage modules for this course
          </div>
        </div>
      <div style={{ display: "flex", gap: 8 }}>
  <button onClick={() => setShowAiModules(true)} style={aiCreateBtnStyle}>
    <Sparkles size={16} /> Add Modules with AI
  </button>
  <button onClick={() => setModalMode("create")} style={createBtnStyle}>
    <Plus size={16} /> Add Module
  </button>
</div>
      </div>

      {loading && (
        <div style={{ color: "#9ca3af", fontSize: 13.5 }}>
          Loading modules...
        </div>
      )}

      {!loading && modules.length === 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: 40,
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 13.5,
          }}
        >
          No modules yet. Click "Add Module" to create one.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {modules.map((m) => (
          <div
            key={m.id}
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #f0f0f0",
              padding: 16,
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 10,
                  background: m.imageUrl
                    ? `url(${m.imageUrl}) center/cover`
                    : "#f3f4f6",
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  onClick={() =>
                    navigate(`/courses/${courseId}/modules/${m.id}/chapters`)
                  }
                  style={{
                    fontSize: 14.5,
                    fontWeight: 700,
                    color: "#111827",
                    cursor: "pointer",
                    marginBottom: 3,
                  }}
                >
                  {m.name}{" "}
                  {m.isLock && (
                    <Lock
                      size={11}
                      style={{ marginLeft: 4, color: "#9ca3af" }}
                    />
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "#6b7280",
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 3 }}
                  >
                    <BookOpen size={11} /> {m.chapterCount} chapters
                  </span>
                  <span>{m.durationLabel}</span>
                  <span style={{ textTransform: "capitalize" }}>
                    {m.difficultyLevel}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setModalMode(m.id)}
                style={editIconBtnStyle}
              >
                <Pencil size={13} />
              </button>
            </div>
            {m.isDraft && <span style={draftTagStyle}>Draft</span>}
            {m.isFinalAssessment && (
              <AssessmentEntryButton
                entityType="module"
                entityId={m.id}
                style={comingSoonBtnStyle}
              />
            )}
          </div>
        ))}
      </div>

      {modalMode && (
        <ModuleFormModal
          courseId={courseId}
          moduleId={modalMode === "create" ? null : modalMode}
          onClose={() => setModalMode(null)}
          onSaved={() => {
            setModalMode(null);
            load();
          }}
        />
      )}
      {showAiModules && (
  <AiCourseBuilderModal
    mode="add_modules"
    courseId={courseId}
    onClose={() => setShowAiModules(false)}
    onCreated={() => { setShowAiModules(false); load(); }}
  />
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
const createBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};
const editIconBtnStyle = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};
const draftTagStyle = {
  display: "inline-block",
  marginTop: 10,
  background: "#f3f4f6",
  color: "#6b7280",
  fontSize: 10.5,
  fontWeight: 700,
  padding: "3px 8px",
  borderRadius: 999,
  textTransform: "uppercase",
};
const comingSoonBtnStyle = {
  width: "100%",
  marginTop: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  background: "#fff",
  border: "1px solid var(--accent)",
  color: "var(--accent)",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};
const aiCreateBtnStyle = {
  display: "flex", alignItems: "center", gap: 6,
  background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", border: "none",
  borderRadius: 10, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
  boxShadow: "0 2px 10px rgba(124,58,237,0.35)",
};