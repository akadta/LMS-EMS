  import { useState, useEffect } from "react";
  import { useNavigate } from "react-router-dom";
  import { Plus, Pencil, Sparkles, Layers, FileText } from "lucide-react";
  import { courseApi } from "../../api/courseApi";
  import CourseFormModal from "./CourseFormModal";
  import AssessmentEntryButton from "../../components/assessments/AssessmentEntryButton";
  import { resolveImageUrl } from "../../utils/resolveImageUrl";
  import { PlayCircle } from "lucide-react";
  import AiCourseBuilderModal from "../../components/courses/AiCourseBuilderModal";
  import CourseTreeModal from "../../components/courses/CourseTreeModal";
  import { GitBranch ,ShieldCheck} from "lucide-react";
  import CourseProctoringModal from "../../components/courses/CourseProctoringModal";

  export default function CourseList() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editId, setEditId] = useState(null);
    const [showAiCourseBuilder, setShowAiCourseBuilder] = useState(false);
    const [treeCourseId, setTreeCourseId] = useState(null);
    const [proctorCourseId, setProctorCourseId] = useState(null);
    const navigate = useNavigate();

    const load = () => {
      setLoading(true);
      courseApi
        .listCourses()
        .then((res) => {
          const data = (res.data.data || []).map((c) => ({
            ...c,
            coverImageUrl: resolveImageUrl(c.coverImageUrl),
          }));
          setCourses(data);
        })
        .finally(() => setLoading(false));
    };

    useEffect(() => {
      load();
    }, []);

    return (
      <div>
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
              Courses
            </div>
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
              Manage your organization's courses
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => navigate("/courses/create")}
              style={{
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
              }}
            >
              <Plus size={16} /> Create Course
            </button>
            <button
              onClick={() => setShowAiCourseBuilder(true)}
              style={aiCreateBtnStyle}
            >
              <Sparkles size={16} /> Create with AI
            </button>
          </div>
        </div>

        {loading && (
          <div style={{ color: "#9ca3af", fontSize: 13.5 }}>
            Loading courses...
          </div>
        )}

        {!loading && courses.length === 0 && (
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
            No courses yet. Create your first course to get started.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
            gap: 18,
          }}
        >
          {courses.map((c) => (
            <div
              key={c.id}
              style={{
                background: "#fff",
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid #f0f0f0",
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  height: 140,
                  background: c.coverImageUrl
                    ? `url(${c.coverImageUrl}) center/cover`
                    : "#f3f4f6",
                  position: "relative",
                }}
              >
                {c.isDraft && (
                  <span
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 10,
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 999,
                      textTransform: "uppercase",
                    }}
                  >
                    Draft
                  </span>
                )}

                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    display: "flex",
                    gap: 6,
                  }}
                >
                  <button
                    onClick={() => setTreeCourseId(c.id)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      border: "none",
                      background: "rgba(255,255,255,0.9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    title="View course tree"
                  >
                    <GitBranch size={14} color="#7c3aed" />
                  </button>
                  <button
                    onClick={() => navigate(`/courses/${c.id}/demo`)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      border: "none",
                      background: "rgba(255,255,255,0.9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                    title="Preview as student"
                  >
                    <PlayCircle size={14} color="var(--accent)" />
                  </button>
                  <button
                    onClick={() => setEditId(c.id)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      border: "none",
                      background: "rgba(255,255,255,0.9)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Pencil size={14} color="#374151" />
                  </button>
                  <button
  onClick={() => setProctorCourseId(c.id)}
  style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.9)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
  title="Proctoring settings"
>
  <ShieldCheck size={14} color="#dc2626" />
</button>
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <div
                  onClick={() => navigate(`/courses/${c.id}/modules`)}
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#111827",
                    cursor: "pointer",
                    marginBottom: 4,
                  }}
                >
                  {c.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Layers size={12} /> {c.moduleCount} modules
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <FileText size={12} /> {c.durationLabel}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      background: "rgba(var(--accent-rgb),0.1)",
                      color: "var(--accent)",
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 999,
                      textTransform: "capitalize",
                    }}
                  >
                    {c.difficultyLevel}
                  </span>
                  {c.categories.slice(0, 2).map((cat) => (
                    <span
                      key={cat}
                      style={{
                        background: "#f3f4f6",
                        color: "#6b7280",
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 999,
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
                {c.isFinalAssessment && (
                  <AssessmentEntryButton
                    entityType="course"
                    entityId={c.id}
                    style={{
                      width: "100%",
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
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {editId && (
          <CourseFormModal
            courseId={editId}
            onClose={() => setEditId(null)}
            onSaved={() => {
              setEditId(null);
              load();
            }}
          />
        )}
        {showAiCourseBuilder && (
          <AiCourseBuilderModal
            mode="full_course"
            onClose={() => setShowAiCourseBuilder(false)}
            onCreated={() => {
              setShowAiCourseBuilder(false);
              load();
            }}
          />
        )}
        {treeCourseId && (
          <CourseTreeModal
            courseId={treeCourseId}
            onClose={() => setTreeCourseId(null)}
            onPublished={load}
          />
        )}
        {proctorCourseId && (
  <CourseProctoringModal courseId={proctorCourseId} onClose={() => setProctorCourseId(null)} onSaved={load} />
)}
      </div>
    );
  }

  const aiCreateBtnStyle = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 16px",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 2px 10px rgba(124,58,237,0.35)",
  };
