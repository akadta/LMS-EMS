import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, BookOpen } from "lucide-react";
import { studentLearningApi } from "../../api/studentLearningApi";

export default function StudentBatches() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentLearningApi
      .getBatches()
      .then((res) => setBatches(res.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#111827",
          marginBottom: 4,
        }}
      >
        Your Courses
      </div>
      <div style={{ fontSize: 13.5, color: "#6b7280", marginBottom: 24 }}>
        Select a batch to view your allocated courses
      </div>

      {loading && (
        <div style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</div>
      )}
      {!loading && batches.length === 0 && (
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
          You haven't been added to any batches yet.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {batches.map((b) => (
          <div
            key={b.batchId}
            onClick={() => navigate(`/student/batches/${b.batchId}`)}
            style={{
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #f0f0f0",
              padding: 22,
              cursor: "pointer",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              transition: "box-shadow 0.15s ease",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(var(--accent-rgb),0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 14,
              }}
            >
              <Layers size={20} color="var(--accent)" />
            </div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: "#111827" }}>
              {b.batchName}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "#9ca3af",
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <BookOpen size={13} /> {b.courseCount} course(s)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
