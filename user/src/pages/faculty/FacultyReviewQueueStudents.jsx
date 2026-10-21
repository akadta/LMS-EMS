import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Hourglass } from "lucide-react";
import { facultyPortalApi } from "../../api/facultyPortalApi";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

export default function FacultyReviewQueueStudents() {
  const { batchCourseId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = (q) => {
    setLoading(true);
    facultyPortalApi.getReviewQueueStudents(batchCourseId, q).then((res) => setItems(res.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(""); }, [batchCourseId]);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <button onClick={() => navigate("/faculty/review-queue")} style={backBtnStyle}>
        <ArrowLeft size={15} /> Back to courses
      </button>
      <div style={{ fontSize: 19, fontWeight: 800, color: "#111827", marginBottom: 16 }}>Students Awaiting Review</div>

      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students..."
          style={{ width: "100%", boxSizing: "border-box", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px 10px 34px", fontSize: 13, outline: "none" }}
        />
      </div>

      {loading && <div style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</div>}
      {!loading && items.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13.5, border: "1px solid #f0f0f0" }}>
          No students found.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((s) => (
          <div
            key={s.studentId}
            onClick={() => navigate(`/faculty/batch-courses/${batchCourseId}/students/${s.studentId}`)}
            style={{
              background: "#fff", border: "1px solid #f0f0f0", borderRadius: 12, padding: 14,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
            }}
          >
            {s.photoUrl ? (
              <img src={resolveImageUrl(s.photoUrl)} alt="" style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#f3f4f6" }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>{s.name}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#fef3c7", color: "#d97706", fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>
              <Hourglass size={11} /> {s.pendingCount} pending
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const backBtnStyle = { display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#6b7280", fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0 };