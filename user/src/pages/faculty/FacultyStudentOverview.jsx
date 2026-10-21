import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { facultyPortalApi } from "../../api/facultyPortalApi";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "not_attempted", label: "Not Attempted" },
  { value: "pending_review", label: "Pending Review" },
  { value: "failed_blocked", label: "Failed / Blocked" },
  { value: "passed", label: "Passed" },
  { value: "approved", label: "Approved" },
];

export default function FacultyStudentOverview() {
  const { batchCourseId, studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    facultyPortalApi
      .getStudentCourseOverview(studentId, batchCourseId)
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, [studentId, batchCourseId]);

  const filteredModules = useMemo(() => {
    if (!data) return [];
    return data.modules.filter((m) => {
      const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "not_attempted" && (!m.hasGate || m.gateStatus === "not_attempted")) ||
        m.gateStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  if (loading || !data)
    return <div style={{ color: "#9ca3af", fontSize: 13.5, maxWidth: 900, margin: "0 auto" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={backBtnStyle}>
        <ArrowLeft size={15} /> Back to student list
      </button>

      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #f0f0f0",
          padding: 22,
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {data.photoUrl ? (
          <img src={resolveImageUrl(data.photoUrl)} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#f3f4f6" }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>{data.name}</div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{data.courseName}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>
            {data.modulesCompleted}/{data.totalModules}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>modules completed</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search modules..."
            style={{ ...inputStyle, paddingLeft: 34 }}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, width: 180 }}>
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f0f0f0", overflow: "hidden" }}>
        <div style={tableHeaderRow}>
          <div style={{ flex: 3 }}>Module</div>
          <div style={{ flex: 1.5, textAlign: "center" }}>Chapters</div>
          <div style={{ flex: 1.5, textAlign: "center" }}>Status</div>
        </div>
        {filteredModules.length === 0 && (
          <div style={{ padding: 30, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No modules match your filters.</div>
        )}
        {filteredModules.map((m) => (
          <div
            key={m.id}
            onClick={() => navigate(`/faculty/batch-courses/${batchCourseId}/students/${studentId}/modules/${m.id}`)}
            style={tableRow}
          >
            <div style={{ flex: 3, display: "flex", alignItems: "center", gap: 10 }}>
              {m.completed ? <CheckCircle2 size={16} color="#16a34a" /> : <Circle size={16} color="#d1d5db" />}
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{m.name}</span>
              {m.hasGate && <Sparkles size={12} color="var(--accent)" />}
            </div>
            <div style={{ flex: 1.5, textAlign: "center", fontSize: 12.5, color: "#6b7280" }}>
              {m.chaptersCompleted}/{m.chapterCount}
            </div>
            <div style={{ flex: 1.5, textAlign: "center" }}>
              <StatusPill status={m.hasGate ? m.gateStatus : null} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatusPill({ status }) {
  if (!status) return <span style={{ fontSize: 11, color: "#d1d5db" }}>—</span>;
  const map = {
    not_attempted: ["#f3f4f6", "#6b7280", "Not Attempted"],
    pending_review: ["#fef3c7", "#d97706", "Pending Review"],
    failed_blocked: ["#fee2e2", "#dc2626", "Failed / Blocked"],
    passed: ["#dcfce7", "#16a34a", "Passed"],
    approved: ["#dcfce7", "#16a34a", "Approved"],
    graded_not_approved: ["#fef3c7", "#d97706", "Awaiting Approval"],
    no_assessment: ["#f3f4f6", "#9ca3af", "No Assessment"],
    not_published: ["#fee2e2", "#dc2626", "Not Published"],
  };
  const [bg, color, label] = map[status] || ["#f3f4f6", "#6b7280", status];
  return (
    <span style={{ background: bg, color, fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>
      {label}
    </span>
  );
}
const inputStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "9px 12px",
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box",
};
const tableHeaderRow = {
  display: "flex",
  padding: "10px 16px",
  background: "#f9fafb",
  fontSize: 11,
  fontWeight: 700,
  color: "#9ca3af",
  textTransform: "uppercase",
  borderBottom: "1px solid #f0f0f0",
};
const tableRow = {
  display: "flex",
  alignItems: "center",
  padding: "13px 16px",
  borderBottom: "1px solid #f6f6f6",
  cursor: "pointer",
};
const backBtnStyle = {
  display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
  color: "#6b7280", fontSize: 13, cursor: "pointer", marginBottom: 14, padding: 0,
};