import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  BookOpen,
  Plus,
  Search,
  X,
  Trash2,
} from "lucide-react";
import { batchApi } from "../../api/batchApi";
import { resolveImageUrl } from "../../utils/resolveImageUrl";
import ConfirmModal from "../../components/ConfirmModal";

export default function BatchDetail() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState(null);
  const [tab, setTab] = useState("students"); // students | courses
  const [showAddStudents, setShowAddStudents] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);

  const [roster, setRoster] = useState({ items: [], totalCount: 0 });
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterSearch, setRosterSearch] = useState("");
  const [rosterLoading, setRosterLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState(null);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const pageSize = 25;

  const loadBatch = () =>
    batchApi.get(batchId).then((res) => setBatch(res.data.data));

  const loadRoster = useCallback(() => {
    setRosterLoading(true);
    batchApi
      .getRoster(batchId, { search: rosterSearch, page: rosterPage, pageSize })
      .then((res) => {
        const d = res.data.data;
        setRoster({
          ...d,
          items: d.items.map((s) => ({
            ...s,
            photoUrl: resolveImageUrl(s.photoUrl),
          })),
        });
      })
      .finally(() => setRosterLoading(false));
  }, [batchId, rosterSearch, rosterPage]);

  const loadCourses = () => {
    setCoursesLoading(true);
    batchApi
      .getBatchCourses(batchId)
      .then((res) =>
        setCourses(
          (res.data.data || []).map((c) => ({
            ...c,
            coverImageUrl: resolveImageUrl(c.coverImageUrl),
          })),
        ),
      )
      .finally(() => setCoursesLoading(false));
  };

  useEffect(() => {
    loadBatch();
  }, [batchId]);
  useEffect(() => {
    if (tab === "students") loadRoster();
  }, [tab, loadRoster]);
  useEffect(() => {
    if (tab === "courses") loadCourses();
  }, [tab, batchId]);

  const confirmRemove = async () => {
    await batchApi.removeFromRoster(batchId, removeTarget.id);
    setRemoveTarget(null);
    loadRoster();
    loadBatch();
  };

  const totalPages = Math.max(1, Math.ceil(roster.totalCount / pageSize));

  if (!batch)
    return (
      <div style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading batch...</div>
    );

  return (
    <div style={{ maxWidth: 900 }}>
      <button onClick={() => navigate("/batches")} style={backBtnStyle}>
        <ArrowLeft size={15} /> Back to batches
      </button>

      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#111827",
          marginBottom: 2,
        }}
      >
        {batch.name}
      </div>
      {batch.description && (
        <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
          {batch.description}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <TabBtn
          active={tab === "students"}
          onClick={() => setTab("students")}
          icon={Users}
          label={`Students (${batch.studentCount})`}
        />
        <TabBtn
          active={tab === "courses"}
          onClick={() => setTab("courses")}
          icon={BookOpen}
          label="Courses"
        />
      </div>

      {tab === "students" && (
        <div>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 14,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: "1 1 200px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "9px 12px",
              }}
            >
              <Search size={14} color="#9ca3af" />
              <input
                value={rosterSearch}
                onChange={(e) => {
                  setRosterSearch(e.target.value);
                  setRosterPage(1);
                }}
                placeholder="Search roster..."
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  flex: 1,
                }}
              />
            </div>
            <button
              onClick={() => setShowAddStudents(true)}
              style={addBtnStyle}
            >
              <Plus size={15} /> Add Students
            </button>
          </div>

          {rosterLoading && (
            <div style={{ color: "#9ca3af", fontSize: 13 }}>Loading...</div>
          )}
          {!rosterLoading && roster.items.length === 0 && (
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 30,
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 13,
              }}
            >
              No students in this batch yet.
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {roster.items.map((s) => (
              <div
                key={s.id}
                style={{
                  background: "#fff",
                  border: "1px solid #f0f0f0",
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {s.photoUrl ? (
                  <img
                    src={s.photoUrl}
                    alt=""
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "#f3f4f6",
                    }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}
                  >
                    {s.name}
                  </div>
                  <div style={{ fontSize: 11.5, color: "#9ca3af" }}>
                    {s.email || s.phoneNumber || ""}
                  </div>
                </div>
                <button
                  onClick={() => setRemoveTarget(s)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: "1px solid #fecaca",
                    background: "#fff",
                    color: "#dc2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {roster.totalCount > pageSize && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginTop: 16,
              }}
            >
              <button
                disabled={rosterPage === 1}
                onClick={() => setRosterPage((p) => p - 1)}
                style={pageBtnStyle(rosterPage === 1)}
              >
                Previous
              </button>
              <span
                style={{
                  fontSize: 12.5,
                  color: "#6b7280",
                  alignSelf: "center",
                }}
              >
                Page {rosterPage} of {totalPages}
              </span>
              <button
                disabled={rosterPage === totalPages}
                onClick={() => setRosterPage((p) => p + 1)}
                style={pageBtnStyle(rosterPage === totalPages)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {tab === "courses" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 14,
            }}
          >
            <button onClick={() => setShowAddCourse(true)} style={addBtnStyle}>
              <Plus size={15} /> Add Course
            </button>
          </div>
          {coursesLoading && (
            <div style={{ color: "#9ca3af", fontSize: 13 }}>Loading...</div>
          )}
          {!coursesLoading && courses.length === 0 && (
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 30,
                textAlign: "center",
                color: "#9ca3af",
                fontSize: 13,
              }}
            >
              No courses added to this batch yet.
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 14,
            }}
          >
            {courses.map((c) => (
              <div
                key={c.batchCourseId}
                onClick={() =>
                  navigate(`/batches/${batchId}/courses/${c.batchCourseId}`)
                }
                style={{
                  background: "#fff",
                  border: "1px solid #f0f0f0",
                  borderRadius: 12,
                  overflow: "hidden",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    height: 100,
                    background: c.coverImageUrl
                      ? `url(${c.coverImageUrl}) center/cover`
                      : "#f3f4f6",
                  }}
                />
                <div style={{ padding: 14 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    {c.courseName}
                  </div>
                  <div
                    style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 4 }}
                  >
                    {c.allocatedCount} / {c.rosterCount} allocated
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddStudents && (
        <AddStudentsModal
          batchId={batchId}
          onClose={() => setShowAddStudents(false)}
          onDone={() => {
            setShowAddStudents(false);
            loadRoster();
            loadBatch();
          }}
        />
      )}
      {showAddCourse && (
        <AddCourseModal
          batchId={batchId}
          onClose={() => setShowAddCourse(false)}
          onAdded={() => {
            setShowAddCourse(false);
            loadCourses();
            loadBatch();
          }}
        />
      )}
      {removeTarget && (
        <ConfirmModal
          title="Remove student from batch?"
          message={`${removeTarget.name} will be removed from this batch's roster and unallocated from every course in this batch.`}
          confirmLabel="Remove"
          onConfirm={confirmRemove}
          onCancel={() => setRemoveTarget(null)}
        />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "none",
        border: "none",
        padding: "10px 4px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        color: active ? "var(--accent)" : "#6b7280",
        borderBottom: active
          ? "2px solid var(--accent)"
          : "2px solid transparent",
        marginRight: 16,
      }}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

function AddStudentsModal({ batchId, onClose, onDone }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState({ items: [], totalCount: 0 });
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      batchApi
        .searchAvailableStudents(batchId, { search, page, pageSize })
        .then((res) => {
          const d = res.data.data;
          setResults({
            ...d,
            items: d.items.map((s) => ({
              ...s,
              photoUrl: resolveImageUrl(s.photoUrl),
            })),
          });
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [batchId, search, page]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const confirmSelected = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    await batchApi.addStudentsToRoster(batchId, Array.from(selected));
    setSaving(false);
    onDone();
  };

  const addAllMatching = async () => {
    setSaving(true);
    await batchApi.addAllMatchingToRoster(batchId, search);
    setSaving(false);
    onDone();
  };

  const totalPages = Math.max(1, Math.ceil(results.totalCount / pageSize));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,15,20,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "min(500px, 92vw)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 18, borderBottom: "1px solid #f0f0f0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              Add Students to Batch
            </div>
            <button
              onClick={onClose}
              style={{
                border: "none",
                background: "#f3f4f6",
                borderRadius: 8,
                width: 28,
                height: 28,
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid #e5e7eb",
              borderRadius: 9,
              padding: "7px 10px",
            }}
          >
            <Search size={13} color="#9ca3af" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search students..."
              style={{ border: "none", outline: "none", fontSize: 13, flex: 1 }}
            />
          </div>
          {results.totalCount > pageSize && (
            <button
              onClick={addAllMatching}
              disabled={saving}
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "var(--accent)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                padding: 0,
              }}
            >
              Add all {results.totalCount} matching students (not just this
              page)
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {loading && (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                fontSize: 12.5,
                color: "#9ca3af",
              }}
            >
              Searching...
            </div>
          )}
          {!loading && results.items.length === 0 && (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                fontSize: 12.5,
                color: "#9ca3af",
              }}
            >
              No available students found.
            </div>
          )}
          {results.items.map((s) => (
            <div
              key={s.id}
              onClick={() => toggle(s.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 10,
                cursor: "pointer",
                background: selected.has(s.id)
                  ? "rgba(var(--accent-rgb),0.08)"
                  : "transparent",
              }}
            >
              {s.photoUrl ? (
                <img
                  src={s.photoUrl}
                  alt=""
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#f3f4f6",
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}
                >
                  {s.name}
                </div>
                {s.email && (
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    {s.email}
                  </div>
                )}
              </div>
              <input
                type="checkbox"
                checked={selected.has(s.id)}
                readOnly
                style={{ width: 16, height: 16, accentColor: "var(--accent)" }}
              />
            </div>
          ))}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginTop: 10,
              }}
            >
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                style={pageBtnStyle(page === 1)}
              >
                Prev
              </button>
              <span
                style={{ fontSize: 12, color: "#6b7280", alignSelf: "center" }}
              >
                {page}/{totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={pageBtnStyle(page === totalPages)}
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: 14, borderTop: "1px solid #f0f0f0" }}>
          <button
            onClick={confirmSelected}
            disabled={saving || selected.size === 0}
            style={{
              width: "100%",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: 11,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              opacity: selected.size === 0 ? 0.6 : 1,
            }}
          >
            {saving ? "Adding..." : `Add Selected (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddCourseModal({ batchId, onClose, onAdded }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      batchApi
        .getAvailableCourses(batchId, search)
        .then((res) => setResults(res.data.data || []));
    }, 250);
    return () => clearTimeout(t);
  }, [batchId, search]);

  const add = async (courseId) => {
    setSaving(true);
    await batchApi.addCourseToBatch(batchId, courseId);
    setSaving(false);
    onAdded();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,15,20,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "min(440px, 92vw)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 18, borderBottom: "1px solid #f0f0f0" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              Add Course to Batch
            </div>
            <button
              onClick={onClose}
              style={{
                border: "none",
                background: "#f3f4f6",
                borderRadius: 8,
                width: 28,
                height: 28,
                cursor: "pointer",
              }}
            >
              <X size={14} />
            </button>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid #e5e7eb",
              borderRadius: 9,
              padding: "7px 10px",
            }}
          >
            <Search size={13} color="#9ca3af" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses..."
              style={{ border: "none", outline: "none", fontSize: 13, flex: 1 }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {results.length === 0 && (
            <div
              style={{
                padding: 20,
                textAlign: "center",
                fontSize: 12.5,
                color: "#9ca3af",
              }}
            >
              No courses found.
            </div>
          )}
          {results.map((c) => (
            <div
              key={c.id}
              onClick={() => !saving && add(c.id)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#111827",
              }}
            >
              {c.name}
            </div>
          ))}
        </div>
      </div>
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
const addBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "var(--accent)",
  color: "#fff",
  border: "none",
  borderRadius: 9,
  padding: "9px 14px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};
function pageBtnStyle(disabled) {
  return {
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontSize: 12,
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}
