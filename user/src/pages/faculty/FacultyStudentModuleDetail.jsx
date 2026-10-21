import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { facultyPortalApi } from "../../api/facultyPortalApi";
import { StatusPill } from "./FacultyStudentOverview";

export default function FacultyStudentModuleDetail() {
  const { batchCourseId, studentId, moduleId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    facultyPortalApi
      .getModuleDetailForStudent(studentId, moduleId)
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, [studentId, moduleId]);

  const filteredChapters = useMemo(() => {
    if (!data) return [];
    return data.chapters.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  if (loading || !data)
    return <div style={{ color: "#9ca3af", fontSize: 13.5, maxWidth: 900, margin: "0 auto" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={backBtnStyle}>
        <ArrowLeft size={15} /> Back to modules
      </button>

      <div style={{ fontSize: 19, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{data.moduleName}</div>
      <div style={{ fontSize: 13, color: data.completed ? "#16a34a" : "#9ca3af", marginBottom: 20, fontWeight: 600 }}>
        {data.completed ? "Module completed" : "In progress"}
      </div>

      {data.moduleAssessment && (
        <div
          onClick={() => navigate(`/faculty/students/${studentId}/assessments/${data.moduleAssessment.assessmentId}/attempts`)}
          style={{
            background: "#fff",
            border: "1px solid var(--accent)",
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Sparkles size={18} color="var(--accent)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#111827" }}>
              Module Final Assessment — {data.moduleAssessment.assessmentName}
            </div>
            <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 2 }}>
              {data.moduleAssessment.attempts.length} attempt(s) · Click to view full history
            </div>
          </div>
          {data.moduleAssessment.attempts[0] && (
  <StatusPill
    status={(() => {
      const a = data.moduleAssessment.attempts[0];
      if (a.status === "grading") return "pending_review";
      if (a.status === "approved") return "approved";
      if (a.passed === false) return a.facultyOverrideUnlock ? "passed" : "failed_blocked";
      if (a.passed === true) return "passed";
      return "graded_not_approved";
    })()}
  />
)}
        </div>
      )}

      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search chapters..."
          style={{ ...inputStyle, paddingLeft: 34 }}
        />
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", overflow: "hidden" }}>
        <div style={tableHeaderRow}>
          <div style={{ flex: 3 }}>Chapter</div>
          <div style={{ flex: 2, textAlign: "center" }}>Completed At</div>
          <div style={{ flex: 1.5, textAlign: "center" }}>Status</div>
        </div>
        {filteredChapters.length === 0 && (
          <div style={{ padding: 30, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No chapters match your search.</div>
        )}
        {filteredChapters.map((c) => (
          <div
            key={c.id}
            onClick={() =>
              c.hasGate && c.assessmentId
                ? navigate(`/faculty/students/${studentId}/assessments/${c.assessmentId}/attempts`)
                : null
            }
            style={{ ...tableRow, cursor: c.hasGate ? "pointer" : "default" }}
          >
            <div style={{ flex: 3, display: "flex", alignItems: "center", gap: 10 }}>
              {c.completed ? <CheckCircle2 size={15} color="#16a34a" /> : <Circle size={15} color="#d1d5db" />}
              <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{c.name}</span>
              {c.hasGate && <Sparkles size={12} color="var(--accent)" />}
            </div>
            <div style={{ flex: 2, textAlign: "center", fontSize: 11.5, color: "#9ca3af" }}>
              {c.completedAt ? new Date(c.completedAt).toLocaleString() : "—"}
            </div>
            <div style={{ flex: 1.5, textAlign: "center" }}>
              <StatusPill status={c.hasGate ? c.gateStatus : null} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  border: "1px solid #e5e7eb", borderRadius: 10, padding: "9px 12px", fontSize: 13,
  outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box",
};
const tableHeaderRow = {
  display: "flex", padding: "10px 16px", background: "#f9fafb", fontSize: 11, fontWeight: 700,
  color: "#9ca3af", textTransform: "uppercase", borderBottom: "1px solid #f0f0f0",
};
const tableRow = {
  display: "flex", alignItems: "center", padding: "13px 16px", borderBottom: "1px solid #f6f6f6",
};
const backBtnStyle = {
  display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
  color: "#6b7280", fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0,
};