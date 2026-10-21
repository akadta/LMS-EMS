import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert, Hourglass } from "lucide-react";
import { facultyPortalApi } from "../../api/facultyPortalApi";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

export default function FacultyStudentTracking() {
  const { batchCourseId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    facultyPortalApi
      .getStudentTracking(batchCourseId)
      .then((res) =>
        setStudents(
          (res.data.data || []).map((s) => ({
            ...s,
            photoUrl: resolveImageUrl(s.photoUrl),
          })),
        ),
      )
      .finally(() => setLoading(false));
  }, [batchCourseId]);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <button onClick={() => navigate("/faculty/batches")} style={backBtnStyle}>
        <ArrowLeft size={15} /> Back
      </button>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#111827",
          marginBottom: 20,
        }}
      >
        Student Progress
      </div>

      {loading && (
        <div style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {students.map((s) => (
          <div
  key={s.studentId}
  onClick={() => navigate(`/faculty/batch-courses/${batchCourseId}/students/${s.studentId}`)}
  style={{
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #f0f0f0",
    padding: 16,
    display: "flex",
    alignItems: "center",
    gap: 14,
    cursor: "pointer",
  }}
>
            {s.photoUrl ? (
              <img
                src={s.photoUrl}
                alt=""
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: "#f3f4f6",
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                {s.name}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                {s.currentModuleName
                  ? `On: ${s.currentModuleName}${s.currentChapterName ? ` — ${s.currentChapterName}` : ""}`
                  : "Not started"}
              </div>
              <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 3 }}>
                {s.modulesCompleted} / {s.totalModules} modules completed
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                alignItems: "flex-end",
              }}
            >
              {s.hasPendingReview && (
                <span style={tagStyle("#fef3c7", "#d97706")}>
                  <Hourglass size={11} /> Pending Review
                </span>
              )}
              {s.isBlockedOnOverride && (
                <span style={tagStyle("#fee2e2", "#dc2626")}>
                  <ShieldAlert size={11} /> Blocked
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function tagStyle(bg, color) {
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
