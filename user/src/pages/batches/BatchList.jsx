import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, BookOpen, Power } from "lucide-react";
import { batchApi } from "../../api/batchApi";
import { inputStyle, submitBtnStyle } from "../courses/CreateCourse";

export default function BatchList() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    batchApi
      .list()
      .then((res) => setBatches(res.data.data || []))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
            Batches
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
            Allocate courses to student cohorts
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus size={16} /> Create Batch
        </button>
      </div>

      {loading && (
        <div style={{ color: "#9ca3af", fontSize: 13.5 }}>
          Loading batches...
        </div>
      )}
      {!loading && batches.length === 0 && (
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            padding: 40,
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 13.5,
          }}
        >
          No batches yet. Create one to start allocating courses to students.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
          gap: 16,
        }}
      >
        {batches.map((b) => (
          <div
            key={b.id}
            onClick={() => navigate(`/batches/${b.id}`)}
            style={{
              background: "#fff",
              borderRadius: 14,
              border: "1px solid #f0f0f0",
              padding: 18,
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                {b.name}
              </div>
              {!b.isActive && (
                <span
                  style={{
                    background: "#fee2e2",
                    color: "#dc2626",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 999,
                    textTransform: "uppercase",
                  }}
                >
                  Inactive
                </span>
              )}
            </div>
            {b.description && (
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                {b.description}
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: 14,
                marginTop: 12,
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Users size={13} /> {b.studentCount} students
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <BookOpen size={13} /> {b.courseCount} courses
              </span>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateBatchModal
          onClose={() => setShowCreate(false)}
          onCreated={(id) => navigate(`/batches/${id}`)}
        />
      )}
    </div>
  );
}

function CreateBatchModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Batch name is required.");
    setSaving(true);
    try {
      const res = await batchApi.create({ name, description });
      onCreated(res.data.data.id);
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || "Failed to create batch.");
      setSaving(false);
    }
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
          padding: 22,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          Create Batch
        </div>
        <form onSubmit={submit}>
          {error && (
            <div
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                fontSize: 13,
                padding: "9px 12px",
                borderRadius: 8,
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Batch Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 2025 Intake — Web Dev"
              style={inputStyle}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: "block",
                fontSize: 12.5,
                fontWeight: 600,
                color: "#374151",
                marginBottom: 6,
              }}
            >
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: 10,
                border: "1px solid #e5e7eb",
                background: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ ...submitBtnStyle, flex: 1 }}
            >
              {saving ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
