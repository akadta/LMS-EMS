import { useState, useEffect, useRef } from "react";
import { Search, X, Plus, Pencil, Trash2 } from "lucide-react";
import api from "../../api/Axios";

const colors = {
  bg: "#ffffff",
  card: "#f9fafb",
  border: "#e2e4e8",
  text: "#111318",
  textMuted: "#6b7280",
  textFaint: "#9ca3af",
  accent: "#111318",
  red: "#dc2626",
};

export default function CategoryMultiSelect({ selectedIds, onChange }) {
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const boxRef = useRef(null);

  const loadCategories = async () => {
    const res = await api.get("/central/organization-categories");
    setCategories(res.data.data);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    function onClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const toggle = (id) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((i) => i !== id));
    else onChange([...selectedIds, id]);
  };

  const selectedNames = categories
    .filter((c) => selectedIds.includes(c.id))
    .map((c) => c.name);

  const saveCategory = async () => {
    if (!name.trim()) return;
    if (editing) {
      await api.put(`/central/organization-categories/${editing.id}`, { name });
    } else {
      await api.post("/central/organization-categories", { name });
    }
    setName("");
    setEditing(null);
    await loadCategories();
  };

  const deleteCategory = async (id) => {
    await api.delete(`/central/organization-categories/${id}`);
    onChange(selectedIds.filter((i) => i !== id));
    await loadCategories();
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <label style={styles.label}>Categories</label>
      <div style={styles.control} onClick={() => setOpen(true)}>
        <div style={styles.chips}>
          {selectedNames.length === 0 && (
            <span style={{ color: colors.textFaint, fontSize: 13 }}>
              Select categories...
            </span>
          )}
          {selectedNames.map((n) => (
            <span key={n} style={styles.chip}>
              {n}
            </span>
          ))}
        </div>
        <button
          type="button"
          style={styles.addBtn}
          onClick={(e) => {
            e.stopPropagation();
            setModalOpen(true);
          }}
        >
          <Plus size={14} />
        </button>
      </div>

      {open && (
        <div style={styles.dropdown}>
          <div style={styles.searchRow}>
            <Search size={13} color={colors.textFaint} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories"
              style={styles.searchInput}
            />
          </div>
          <div style={styles.optionList}>
            {filtered.map((c) => (
              <label key={c.id} style={styles.option}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c.id)}
                  onChange={() => toggle(c.id)}
                />
                {c.name}
              </label>
            ))}
            {filtered.length === 0 && (
              <div
                style={{ fontSize: 12.5, color: colors.textFaint, padding: 8 }}
              >
                No categories found
              </div>
            )}
          </div>
        </div>
      )}

      {modalOpen && (
        <div style={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                Manage Categories
              </span>
              <button
                type="button"
                style={styles.iconBtnSm}
                onClick={() => setModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={styles.modalRow}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  editing ? "Edit category name" : "New category name"
                }
                style={styles.modalInput}
              />
              <button
                type="button"
                style={styles.saveBtn}
                onClick={saveCategory}
              >
                {editing ? "Update" : "Add"}
              </button>
              {editing && (
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => {
                    setEditing(null);
                    setName("");
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

            <div style={styles.categoryList}>
              {categories.map((c) => (
                <div key={c.id} style={styles.categoryRow}>
                  <span style={{ fontSize: 13 }}>{c.name}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      style={styles.iconBtnSm}
                      onClick={() => {
                        setEditing(c);
                        setName(c.name);
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      style={{ ...styles.iconBtnSm, color: colors.red }}
                      onClick={() => deleteCategory(c.id)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  label: {
    fontSize: 12.5,
    fontWeight: 600,
    color: colors.text,
    marginBottom: 6,
    display: "block",
  },
  control: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: "6px 8px",
    background: colors.bg,
    cursor: "text",
    minHeight: 38,
  },
  chips: { display: "flex", flexWrap: "wrap", gap: 5, flex: 1 },
  chip: {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 6,
    padding: "2px 8px",
    fontSize: 12,
    color: colors.text,
  },
  addBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    background: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginLeft: 6,
    color: colors.text,
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 4px)",
    left: 0,
    right: 0,
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
    zIndex: 40,
    padding: 8,
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: `1px solid ${colors.border}`,
    borderRadius: 7,
    padding: "6px 8px",
    marginBottom: 6,
    background: colors.bg,
  },
  searchInput: {
    border: "none",
    outline: "none",
    fontSize: 13,
    width: "100%",
    background: "none",
    color: colors.text,
  },
  optionList: { maxHeight: 180, overflowY: "auto" },
  option: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 6px",
    fontSize: 13,
    cursor: "pointer",
    borderRadius: 6,
    color: colors.text,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modal: {
    width: 360,
    background: colors.bg,
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalRow: { display: "flex", gap: 6, marginBottom: 12 },
  modalInput: {
    flex: 1,
    border: `1px solid ${colors.border}`,
    borderRadius: 7,
    padding: "7px 10px",
    fontSize: 13,
  },
  saveBtn: {
    background: colors.accent,
    color: "#fff",
    border: "none",
    borderRadius: 7,
    padding: "0 14px",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  cancelBtn: {
    background: "none",
    border: `1px solid ${colors.border}`,
    borderRadius: 7,
    padding: "0 10px",
    fontSize: 12.5,
    cursor: "pointer",
    color: colors.textMuted,
  },
  categoryList: {
    maxHeight: 220,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  categoryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 6px",
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
  },
  iconBtnSm: {
    width: 26,
    height: 26,
    borderRadius: 6,
    border: "none",
    background: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.textMuted,
  },
};
