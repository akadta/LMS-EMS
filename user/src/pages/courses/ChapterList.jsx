import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Sparkles, ArrowLeft, FileImage } from "lucide-react";
import { courseApi } from "../../api/courseApi";
import AssessmentEntryButton from "../../components/assessments/AssessmentEntryButton";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import AiCourseBuilderModal from "../../components/courses/AiCourseBuilderModal";

export default function ChapterList() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAiChapters, setShowAiChapters] = useState(false);

const load = () => {
  setLoading(true);
  courseApi
    .listChapters(moduleId)
    .then((res) => {
      setModule(res.data.data.module);
      const chs = (res.data.data.chapters || []).map((c) => ({
        ...c,
        thumbnailUrl: resolveImageUrl(c.thumbnailUrl),
      }));
      setChapters(chs);
    })
    .finally(() => setLoading(false));
};

useEffect(() => {
  load();
}, [moduleId]);

  return (
    <div>
      <button
        onClick={() => navigate(`/courses/${courseId}/modules`)}
        style={backBtnStyle}
      >
        <ArrowLeft size={15} /> Back to modules
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
            {module?.name || "Chapters"}
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
            Manage chapters for this module
          </div>
        </div>
       <div style={{ display: "flex", gap: 8 }}>
  <button onClick={() => setShowAiChapters(true)} style={aiCreateBtnStyle}>
    <Sparkles size={16} /> Add Chapters with AI
  </button>
  <button
    onClick={() => navigate(`/courses/${courseId}/modules/${moduleId}/chapters/create`)}
    style={createBtnStyle}
  >
    <Plus size={16} /> Add Chapter
  </button>
</div>
      </div>

      {loading && (
        <div style={{ color: "#9ca3af", fontSize: 13.5 }}>
          Loading chapters...
        </div>
      )}

      {!loading && chapters.length === 0 && (
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
          No chapters yet. Click "Add Chapter" to create one.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {chapters.map((c) => (
          <div
            key={c.id}
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #f0f0f0",
              padding: 14,
              display: "flex",
              alignItems: "center",
              gap: 14,
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 10,
                background: c.thumbnailUrl
                  ? `url(${c.thumbnailUrl}) center/cover`
                  : "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {!c.thumbnailUrl && <FileImage size={17} color="#9ca3af" />}
            </div>
            <div
              onClick={() =>
                navigate(
                  `/courses/${courseId}/modules/${moduleId}/chapters/${c.id}/edit`,
                )
              }
              style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                {c.name}
              </div>
              <div style={{ fontSize: 11.5, color: "#6b7280", marginTop: 2 }}>
                {c.mediaCount} media item(s){c.isDraft ? " · Draft" : ""}
              </div>
            </div>
            {c.isFinalAssessment && (
              <AssessmentEntryButton
                entityType="chapter"
                entityId={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#fff",
                  border: "1px solid var(--accent)",
                  color: "var(--accent)",
                  borderRadius: 8,
                  padding: "7px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        ))}
      </div>
      {showAiChapters && (
  <AiCourseBuilderModal
    mode="add_chapters"
    moduleId={moduleId}
    onClose={() => setShowAiChapters(false)}
    onCreated={() => { setShowAiChapters(false); load(); }}
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
const aiCreateBtnStyle = {
  display: "flex", alignItems: "center", gap: 6,
  background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", border: "none",
  borderRadius: 10, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
  boxShadow: "0 2px 10px rgba(124,58,237,0.35)",
};