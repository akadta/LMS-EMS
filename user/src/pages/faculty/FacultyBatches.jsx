import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, BookOpen } from "lucide-react";
import { facultyPortalApi } from "../../api/facultyPortalApi";

export default function FacultyBatches() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    facultyPortalApi
      .getBatches()
      .then((res) => setItems(res.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#111827",
          marginBottom: 4,
        }}
      >
        Your Batches & Courses
      </div>
      <div style={{ fontSize: 13.5, color: "#6b7280", marginBottom: 24 }}>
        Track student progress across your assigned courses
      </div>

      {loading && (
        <div style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</div>
      )}
      {!loading && items.length === 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 40,
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 13.5,
            border: "1px solid #f0f0f0",
          }}
        >
          You're not assigned to any courses yet.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {items.map((i) => (
          <div
            key={i.batchCourseId}
            onClick={() =>
              navigate(`/faculty/batch-courses/${i.batchCourseId}`)
            }
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #f0f0f0",
              padding: 20,
              cursor: "pointer",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
                fontWeight: 600,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {i.batchName}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 12,
              }}
            >
              {i.courseName}
            </div>
            <div
              style={{
                display: "flex",
                gap: 14,
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Users size={13} /> {i.allocatedStudentCount} students
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
