import { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Plus, Search } from "lucide-react";
import { courseApi } from "../api/courseApi";

export default function CategoryPicker({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [options, setOptions] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const boxRef = useRef(null);

  useEffect(() => {
    courseApi
      .listCategories(search)
      .then((res) => setOptions(res.data.data || []));
  }, [search]);

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggle = (cat) => {
    const exists = selected.some((c) => c.id === cat.id);
    onChange(
      exists ? selected.filter((c) => c.id !== cat.id) : [...selected, cat],
    );
  };

  const createCategory = async () => {
    if (!newName.trim()) return;
    const res = await courseApi.createCategory(newName.trim());
    const cat = res.data.data;
    setOptions((prev) => [cat, ...prev]);
    onChange([...selected, cat]);
    setNewName("");
    setShowCreate(false);
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: "9px 12px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 6,
          minHeight: 42,
          background: "#fff",
        }}
      >
        {selected.length === 0 && (
          <span style={{ color: "#9ca3af", fontSize: 13.5 }}>
            Select categories...
          </span>
        )}
        {selected.map((c) => (
          <span
            key={c.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "rgba(var(--accent-rgb),0.1)",
              color: "var(--accent)",
              padding: "3px 8px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {c.name}
            <X
              size={11}
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                toggle(c);
              }}
            />
          </span>
        ))}
        <ChevronDown
          size={14}
          style={{ marginLeft: "auto", color: "#9ca3af" }}
        />
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
            zIndex: 50,
            maxHeight: 260,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: 8,
              borderBottom: "1px solid #f0f0f0",
              position: "sticky",
              top: 0,
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "6px 8px",
              }}
            >
              <Search size={13} color="#9ca3af" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search category..."
                style={{
                  border: "none",
                  outline: "none",
                  fontSize: 13,
                  flex: 1,
                }}
              />
            </div>
          </div>

          {options.map((cat) => {
            const isSelected = selected.some((c) => c.id === cat.id);
            return (
              <div
                key={cat.id}
                onClick={() => toggle(cat)}
                style={{
                  padding: "9px 14px",
                  fontSize: 13.5,
                  cursor: "pointer",
                  background: isSelected
                    ? "rgba(var(--accent-rgb),0.08)"
                    : "transparent",
                  color: isSelected ? "var(--accent)" : "#374151",
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                {cat.name}
              </div>
            );
          })}
          {options.length === 0 && (
            <div
              style={{ padding: "12px 14px", fontSize: 13, color: "#9ca3af" }}
            >
              No categories found.
            </div>
          )}

          <div style={{ borderTop: "1px solid #f0f0f0", padding: 8 }}>
            {!showCreate ? (
              <div
                onClick={() => setShowCreate(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 10px",
                  cursor: "pointer",
                  color: "var(--accent)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <Plus size={14} /> Add new category
              </div>
            ) : (
              <div style={{ display: "flex", gap: 6, padding: "4px 4px" }}>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Category name"
                  style={{
                    flex: 1,
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "7px 10px",
                    fontSize: 13,
                    outline: "none",
                  }}
                  onKeyDown={(e) => e.key === "Enter" && createCategory()}
                />
                <button
                  type="button"
                  onClick={createCategory}
                  style={{
                    background: "var(--accent)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "0 12px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
