import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Hourglass, ChevronRight } from "lucide-react";
import { facultyPortalApi } from "../../api/facultyPortalApi";

export default function FacultyReviewQueue() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    facultyPortalApi.getReviewQueueCourses().then((res) => setItems(res.data.data || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Pending Reviews</div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Select a course to view students awaiting review</div>

      {loading && <div style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</div>}
      {!loading && items.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13.5, border: "1px solid #f0f0f0" }}>
          Nothing pending review.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((c) => (
          <div
            key={c.batchCourseId}
            onClick={() => navigate(`/faculty/review-queue/${c.batchCourseId}`)}
            style={{
              background: "#fff", border: "1px solid #f0f0f0", borderRadius: 12, padding: 16,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Hourglass size={16} color="#d97706" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{c.courseName}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{c.batchName}</div>
            </div>
            <div style={{ background: "#fef3c7", color: "#d97706", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 999 }}>
              {c.pendingCount} pending
            </div>
            <ChevronRight size={16} color="#d1d5db" />
          </div>
        ))}
      </div>
    </div>
  );
}