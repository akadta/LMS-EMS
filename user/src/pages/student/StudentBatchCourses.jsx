import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { studentLearningApi } from "../../api/studentLearningApi";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

export default function StudentBatchCourses() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(null);

  const load = () => {
    setLoading(true);
    studentLearningApi
      .getBatchCourses(batchId)
      .then((res) =>
        setCourses(
          (res.data.data || []).map((c) => ({
            ...c,
            coverImageUrl: resolveImageUrl(c.coverImageUrl),
          })),
        ),
      )
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, [batchId]);

  const handleStart = async (c) => {
    if (!c.enrolled) {
      setEnrolling(c.batchCourseId);
      await studentLearningApi.enroll(c.batchCourseId);
      setEnrolling(null);
    }
    navigate(`/student/courses/${c.courseId}/modules?batchId=${batchId}`);
  };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <button onClick={() => navigate("/student/batches")} style={backBtnStyle}>
        <ArrowLeft size={15} /> Back to batches
      </button>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#111827",
          marginBottom: 20,
        }}
      >
        Allocated Courses
      </div>

      {loading && (
        <div style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</div>
      )}
      {!loading && courses.length === 0 && (
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
          No courses allocated to you in this batch yet.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {courses.map((c) => (
          <div
            key={c.batchCourseId}
            style={{
              background: "#fff",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid #f0f0f0",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                height: 130,
                background: c.coverImageUrl
                  ? `url(${c.coverImageUrl}) center/cover`
                  : "#f3f4f6",
              }}
            />
            <div style={{ padding: 18 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                {c.courseName}
              </div>

              {c.completed && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "#16a34a",
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  <CheckCircle2 size={14} /> Completed
                </div>
              )}
              {c.expired && !c.completed && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "#dc2626",
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  <Clock size={14} /> Access expired
                </div>
              )}
              {!c.expired && !c.completed && c.enrolled && c.expiresAt && (
                <ExpiryCountdown expiresAt={c.expiresAt} />
              )}

              <button
                onClick={() => handleStart(c)}
                disabled={enrolling === c.batchCourseId || c.expired}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  background: c.expired ? "#f3f4f6" : "var(--accent)",
                  color: c.expired ? "#9ca3af" : "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: c.expired ? "not-allowed" : "pointer",
                }}
              >
                <PlayCircle size={15} />{" "}
                {enrolling === c.batchCourseId
                  ? "Starting..."
                  : c.enrolled
                    ? "Continue"
                    : "Start Course"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function ExpiryCountdown({ expiresAt }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diffMs = new Date(expiresAt).getTime() - Date.now();
      if (diffMs <= 0) {
        setLabel("Expired");
        return;
      }
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      if (days > 0) setLabel(`${days}d ${hours}h left`);
      else {
        const mins = Math.floor((diffMs / (1000 * 60)) % 60);
        setLabel(`${hours}h ${mins}m left`);
      }
    };
    update();
    const t = setInterval(update, 60000); // refresh every minute
    return () => clearInterval(t);
  }, [expiresAt]);

  if (!expiresAt || !label) return null;

  const diffMs = new Date(expiresAt).getTime() - Date.now();
  const urgent = diffMs > 0 && diffMs < 1000 * 60 * 60 * 24 * 3; // under 3 days

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11.5,
        color: urgent ? "#dc2626" : "#6b7280",
        fontWeight: 600,
        marginBottom: 10,
      }}
    >
      <Clock size={13} /> {label}
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
