import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { batchCourseAllocationApi } from "../../api/batchApi";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

export default function BatchCourseAllocation() {
  const { batchId, batchCourseId } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | allocated | unallocated
  const [page, setPage] = useState(1);
  const [results, setResults] = useState({ items: [], totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const pageSize = 30;

  const loadInfo = () =>
    batchCourseAllocationApi
      .getInfo(batchCourseId)
      .then((res) => setInfo(res.data.data));

  const loadResults = useCallback(() => {
    setLoading(true);
    batchCourseAllocationApi
      .searchRoster(batchCourseId, { search, filter, page, pageSize })
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
  }, [batchCourseId, search, filter, page]);

  useEffect(() => {
    loadInfo();
  }, [batchCourseId]);
  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleOne = async (student) => {
    setBusy(true);
    if (student.allocated)
      await batchCourseAllocationApi.deallocate(batchCourseId, [student.id]);
    else await batchCourseAllocationApi.allocate(batchCourseId, [student.id]);
    await Promise.all([loadResults(), loadInfo()]);
    setBusy(false);
  };

  const bulkAllocate = async () => {
    if (selected.size === 0) return;
    setBusy(true);
    await batchCourseAllocationApi.allocate(
      batchCourseId,
      Array.from(selected),
    );
    setSelected(new Set());
    await Promise.all([loadResults(), loadInfo()]);
    setBusy(false);
  };

  const bulkDeallocate = async () => {
    if (selected.size === 0) return;
    setBusy(true);
    await batchCourseAllocationApi.deallocate(
      batchCourseId,
      Array.from(selected),
    );
    setSelected(new Set());
    await Promise.all([loadResults(), loadInfo()]);
    setBusy(false);
  };

  const allocateAllMatching = async () => {
    setBusy(true);
    await batchCourseAllocationApi.allocateAllMatching(batchCourseId, search);
    await Promise.all([loadResults(), loadInfo()]);
    setBusy(false);
  };

  const totalPages = Math.max(1, Math.ceil(results.totalCount / pageSize));

  if (!info)
    return <div style={{ color: "#9ca3af", fontSize: 13.5 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 820 }}>
      <button
        onClick={() => navigate(`/batches/${batchId}`)}
        style={backBtnStyle}
      >
        <ArrowLeft size={15} /> Back to {info.batchName}
      </button>

      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#111827",
          marginBottom: 4,
        }}
      >
        {info.courseName}
      </div>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>
        {info.allocatedCount} of {info.rosterCount} roster students allocated to
        this course
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 14,
          flexWrap: "wrap",
          alignItems: "center",
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
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search students..."
            style={{ border: "none", outline: "none", fontSize: 13, flex: 1 }}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setPage(1);
          }}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "9px 10px",
            fontSize: 12.5,
            color: "#374151",
          }}
        >
          <option value="all">All</option>
          <option value="allocated">Allocated</option>
          <option value="unallocated">Not Allocated</option>
        </select>
      </div>

      {results.totalCount > pageSize && filter !== "allocated" && (
        <button
          onClick={allocateAllMatching}
          disabled={busy}
          style={{
            fontSize: 12,
            color: "var(--accent)",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            padding: 0,
            marginBottom: 12,
          }}
        >
          Allocate all {results.totalCount} matching students (not just this
          page)
        </button>
      )}

      {selected.size > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 12,
            background: "#f9fafb",
            borderRadius: 10,
            padding: "8px 12px",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>
            {selected.size} selected
          </span>
          <button
            onClick={bulkAllocate}
            disabled={busy}
            style={smallBtnStyle(true)}
          >
            Allocate
          </button>
          <button
            onClick={bulkDeallocate}
            disabled={busy}
            style={smallBtnStyle(false)}
          >
            Deallocate
          </button>
        </div>
      )}

      {loading && (
        <div style={{ color: "#9ca3af", fontSize: 13 }}>Loading...</div>
      )}
      {!loading && results.items.length === 0 && (
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
          No students found.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {results.items.map((s) => (
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
            <input
              type="checkbox"
              checked={selected.has(s.id)}
              onChange={() => toggle(s.id)}
              style={{ width: 16, height: 16, accentColor: "var(--accent)" }}
            />
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
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                {s.name}
              </div>
              <div style={{ fontSize: 11.5, color: "#9ca3af" }}>
                {s.email || s.phoneNumber || ""}
              </div>
            </div>
            <button
              onClick={() => toggleOne(s)}
              disabled={busy}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: s.allocated ? "#fee2e2" : "var(--accent)",
                color: s.allocated ? "#dc2626" : "#fff",
              }}
            >
              {s.allocated ? "Remove" : "Allocate"}
            </button>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 16,
          }}
        >
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            style={pageBtnStyle(page === 1)}
          >
            Previous
          </button>
          <span
            style={{ fontSize: 12.5, color: "#6b7280", alignSelf: "center" }}
          >
            Page {page} of {totalPages}
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
function smallBtnStyle(positive) {
  return {
    padding: "6px 12px",
    borderRadius: 8,
    border: "none",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    background: positive ? "var(--accent)" : "#fee2e2",
    color: positive ? "#fff" : "#dc2626",
  };
}
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
