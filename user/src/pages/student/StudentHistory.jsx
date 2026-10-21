import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, BookOpen, Clock, CheckCircle2, XCircle } from "lucide-react";
import { studentLearningApi } from "../../api/studentLearningApi";

export default function StudentHistory() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState(null);

  useEffect(() => {
    studentLearningApi.getHistory().then((res) => setBatches(res.data.data || []));
  }, []);

  if (!batches) return <div style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 4 }}>My History</div>
      <div style={{ fontSize: 13.5, color: "#6b7280", marginBottom: 24 }}>
        Full record of your batches, courses, progress, and marks
      </div>

      {batches.length === 0 && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 40, textAlign: "center", color: "#9ca3af", fontSize: 13.5, border: "1px solid #f0f0f0" }}>
          No history yet.
        </div>
      )}

      {batches.map((b) => (
        <div key={b.batchId} style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Layers size={15} color="var(--accent)" />
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>{b.batchName}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {b.courses.map((c) => (
              <div
                key={c.batchCourseId}
                onClick={() => c.enrolled && navigate(`/student/history/courses/${c.courseId}`)}
                style={{
                  background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", padding: 16,
                  cursor: c.enrolled ? "pointer" : "default", boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <BookOpen size={14} color="var(--accent)" />
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", flex: 1 }}>{c.courseName}</div>
                </div>

                {!c.enrolled ? (
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>Not started yet</div>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                      {c.modulesCompleted}/{c.totalModules} modules completed
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 600 }}>
                      {c.completed ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#16a34a" }}>
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      ) : c.expired ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#dc2626" }}>
                          <XCircle size={12} /> Access expired
                        </span>
                      ) : c.expiresAt ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#6b7280" }}>
                          <Clock size={12} /> Expires {new Date(c.expiresAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span style={{ color: "#6b7280" }}>No expiry</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}