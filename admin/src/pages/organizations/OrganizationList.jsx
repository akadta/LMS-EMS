import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { Search, Eye, Pencil, X, ImagePlus } from "lucide-react";

import api from "../../api/Axios";
import CategoryMultiSelect from "../../components/organizations/CategoryMultiSelect";
import AddressListInput from "../../components/organizations/AddressListInput";
import ThemeCustomizer from "../../components/organizations/ThemeCustomizer";
import { resolveMediaUrl } from "../../utils/resolveMediaUrl";

// Local premium white/black palette — independent of the dark `C` theme
const colors = {
  bg: "#ffffff",
  card: "#ffffff",
  cardAlt: "#f9fafb",
  border: "#e6e7eb",
  borderStrong: "#d8dade",
  text: "#111318",
  textMuted: "#6b7280",
  textFaint: "#9ca3af",
  accent: "#111318",
  accentSoft: "#f3f4f6",
  green: "#059669",
  greenBg: "#ecfdf5",
  red: "#dc2626",
  shadow: "0 1px 2px rgba(16,20,30,0.04)",
  shadowLg: "0 24px 60px rgba(16,20,30,0.18)",
};

export default function OrganizationList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [modalOrgId, setModalOrgId] = useState(null);

  const load = useCallback(async () => {
    const res = await api.get("/central/organizations", {
      params: {
        page,
        pageSize,
        search: search || undefined,
        isActive: status === "" ? undefined : status === "active",
      },
    });
    setItems(res.data.data.items);
    setTotalCount(res.data.data.totalCount);
  }, [page, pageSize, search, status]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const toggleActive = async (id) => {
    await api.patch(`/central/organizations/${id}/toggle-active`);
    load();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div style={styles.page}>
      <style>{`
        .switch-input { opacity: 0; width: 0; height: 0; position: absolute; }
        .org-row:hover { background: ${colors.cardAlt}; }
        .icon-btn-sm:hover { background: ${colors.cardAlt}; }
        .search-box input::placeholder { color: ${colors.textFaint}; }
        .search-box input:focus { outline: none; }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .org-table-scroll {
          overflow-x: auto;
          overflow-y: auto;
          max-height: 65vh;
          -webkit-overflow-scrolling: touch;
        }
        .org-table-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
        .org-table-scroll::-webkit-scrollbar-track { background: transparent; }
        .org-table-scroll::-webkit-scrollbar-thumb {
          background: ${colors.borderStrong};
          border-radius: 8px;
        }
        .org-table-scroll::-webkit-scrollbar-thumb:hover { background: ${colors.textFaint}; }

        .org-table { min-width: 760px; }

        @media (max-width: 720px) {
          .org-header-row { flex-direction: column; align-items: stretch !important; }
          .org-filters { flex-direction: column; }
          .org-filters .search-box { width: 100%; }
          .org-filters select { width: 100%; }
        }

        .org-modal-scroll {
          max-height: 82vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        @media (max-width: 520px) {
          .org-modal { width: 94vw !important; max-width: 94vw !important; }
        }
      `}</style>

      <div className="org-header-row" style={styles.headerRow}>
        <h1 style={styles.title}>Organizations</h1>
        <div className="org-filters" style={styles.filters}>
          <div className="search-box" style={styles.searchBox}>
            <Search size={14} color={colors.textFaint} />
            <input
              placeholder="Search name or email"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              style={styles.searchInput}
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            style={styles.select}
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div style={styles.tableWrap}>
        <div className="org-table-scroll">
          <table className="org-table" style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, position: "sticky", top: 0 }}>
                  Organization
                </th>
                <th style={{ ...styles.th, position: "sticky", top: 0 }}>
                  Email
                </th>
                <th style={{ ...styles.th, position: "sticky", top: 0 }}>
                  Categories
                </th>
                <th style={{ ...styles.th, position: "sticky", top: 0 }}>
                  LMS
                </th>
                <th style={{ ...styles.th, position: "sticky", top: 0 }}>
                  EMS
                </th>
                <th style={{ ...styles.th, position: "sticky", top: 0 }}>
                  Status
                </th>
                <th style={{ ...styles.th, position: "sticky", top: 0 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} className="org-row" style={styles.tr}>
                  <td style={styles.td}>
                    <div
                      onClick={() =>
                        navigate(`/organizations/${o.id}/companies`)
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                      }}
                    >
                      {o.logoUrl ? (
                        <img
                          src={resolveMediaUrl(o.logoUrl)}
                          alt=""
                          style={styles.logo}
                        />
                      ) : (
                        <div style={styles.logoPlaceholder}>{o.name[0]}</div>
                      )}
                      <span
                        style={{
                          textDecoration: "underline",
                          textUnderlineOffset: 2,
                        }}
                      >
                        {o.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...styles.td, color: colors.textMuted }}>
                    {o.email}
                  </td>
                  <td style={{ ...styles.td, color: colors.textMuted }}>
                    {o.categories.join(", ") || "—"}
                  </td>
                  <td style={styles.td}>
                    {o.isLms ? (
                      <span style={styles.badgeGreen}>Yes</span>
                    ) : (
                      <span style={styles.badgeMuted}>—</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    {o.isEms ? (
                      <span style={styles.badgeGreen}>Yes</span>
                    ) : (
                      <span style={styles.badgeMuted}>—</span>
                    )}
                  </td>
                  <td style={styles.td}>
                    <label className="switch" style={styles.switch}>
                      <input
                        className="switch-input"
                        type="checkbox"
                        checked={o.isActive}
                        onChange={() => toggleActive(o.id)}
                      />
                      <span
                        style={{
                          ...styles.slider,
                          background: o.isActive
                            ? colors.accent
                            : colors.border,
                        }}
                      >
                        <span
                          style={{ ...styles.knob, left: o.isActive ? 18 : 2 }}
                        />
                      </span>
                    </label>
                  </td>
                  <td style={styles.td}>
                    <button
                      className="icon-btn-sm"
                      style={styles.iconBtnSm}
                      onClick={() => setModalOrgId(o.id)}
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      color: colors.textFaint,
                      padding: "24px 12px",
                    }}
                  >
                    No organizations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.pagination}>
        <span style={{ fontSize: 12.5, color: colors.textFaint }}>
          {totalCount} organizations · Page {page} of {totalPages}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="page-btn"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={styles.pageBtn}
          >
            Prev
          </button>
          <button
            className="page-btn"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={styles.pageBtn}
          >
            Next
          </button>
        </div>
      </div>

      {modalOrgId && (
        <OrganizationModal
          id={modalOrgId}
          onClose={() => setModalOrgId(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function OrganizationModal({ id, onClose, onSaved }) {
  const [detail, setDetail] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(null);
  const [categoryIds, setCategoryIds] = useState([]);
  const [addresses, setAddresses] = useState([""]);
  const [themeColors, setThemeColors] = useState({
    accent: "#6366f1",
    sidebar: "#0e1220",
    header: "#0a0d16",
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/central/organizations/${id}`).then((res) => {
      const d = res.data.data;
      setDetail(d);
      setForm({
        name: d.name,
        phoneNumber: d.phoneNumber || "",
        isLms: d.isLms,
        isEms: d.isEms,
      });
      setCategoryIds(d.categoryIds || []);
      setAddresses(d.addresses.length ? d.addresses : [""]);
      setThemeColors({
        accent: d.themeColor || "#6366f1",
        sidebar: d.sidebarColor || "#0e1220",
        header: d.headerColor || "#0a0d16",
      });
      setLogoPreview(resolveMediaUrl(d.logoUrl));
    });
  }, [id]);

  if (!detail || !form) return null;

  const handleLogoChange = (file) => {
    if (!file) return;
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const save = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.append("Name", form.name);
    fd.append("PhoneNumber", form.phoneNumber || "");
    fd.append("ThemeColor", themeColors.accent);
    fd.append("SidebarColor", themeColors.sidebar);
    fd.append("HeaderColor", themeColors.header);
    fd.append("IsLms", form.isLms);
    fd.append("IsEms", form.isEms);
    categoryIds.forEach((cid) => fd.append("CategoryIds", cid));
    addresses.filter(Boolean).forEach((a) => fd.append("Addresses", a));
    if (logo) fd.append("Logo", logo);

    await api.put(`/central/organizations/${id}`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setSaving(false);
    setEditMode(false);
    onSaved();
    onClose();
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div
        className="org-modal"
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.modalHeader}>
          <span style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>
            {detail.name}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {!editMode && (
              <button
                className="icon-btn-sm"
                style={styles.iconBtnSm}
                onClick={() => setEditMode(true)}
              >
                <Pencil size={14} />
              </button>
            )}
            <button
              className="icon-btn-sm"
              style={styles.iconBtnSm}
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="org-modal-scroll">
          {!editMode ? (
            <div style={styles.detailList}>
              <DetailRow label="Email" value={detail.email} />
              <DetailRow label="Phone" value={detail.phoneNumber || "—"} />
              <DetailRow
                label="Categories"
                value={detail.categories.join(", ") || "—"}
              />
              <DetailRow
                label="Addresses"
                value={detail.addresses.join(" | ") || "—"}
              />
              <DetailRow
                label="LMS"
                value={detail.isLms ? "Enabled" : "Disabled"}
              />
              <DetailRow
                label="EMS"
                value={detail.isEms ? "Enabled" : "Disabled"}
              />
              <DetailRow
                label="Status"
                value={detail.isActive ? "Active" : "Inactive"}
              />
              {detail.logoUrl && (
                <div style={{ ...styles.detailRow, borderBottom: "none" }}>
                  <span style={{ fontSize: 12.5, color: colors.textFaint }}>
                    Logo
                  </span>
                  <img
                    src={resolveMediaUrl(detail.logoUrl)}
                    alt=""
                    style={styles.logoLarge}
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Organization Name">
                <input
                  style={styles.modalInput}
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Name"
                />
              </Field>

              <Field label="Phone Number">
                <input
                  style={styles.modalInput}
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phoneNumber: e.target.value }))
                  }
                  placeholder="Phone"
                />
              </Field>

              <div style={styles.sectionCard}>
                <CategoryMultiSelect
                  selectedIds={categoryIds}
                  onChange={setCategoryIds}
                />
              </div>

              <div style={styles.sectionCard}>
                <AddressListInput
                  addresses={addresses}
                  onChange={setAddresses}
                />
              </div>

              <div style={styles.sectionCard}>
                <ThemeCustomizer
                  value={themeColors}
                  onChange={setThemeColors}
                />
              </div>

              <Field label="Logo">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {logoPreview ? (
                    <img src={logoPreview} alt="" style={styles.logoLarge} />
                  ) : (
                    <div style={styles.logoPlaceholderModal}>
                      <ImagePlus size={16} color={colors.textFaint} />
                    </div>
                  )}
                  <label style={styles.logoReplaceBtn}>
                    {logoPreview ? "Change logo" : "Upload logo"}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => handleLogoChange(e.target.files?.[0])}
                    />
                  </label>
                </div>
              </Field>

              <div style={{ display: "flex", gap: 16 }}>
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={form.isLms}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isLms: e.target.checked }))
                    }
                  />{" "}
                  LMS
                </label>
                <label style={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={form.isEms}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, isEms: e.target.checked }))
                    }
                  />{" "}
                  EMS
                </label>
              </div>

              <button style={styles.submitBtn} onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: colors.text,
          marginBottom: 6,
          display: "block",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={styles.detailRow}>
      <span style={{ fontSize: 12.5, color: colors.textFaint }}>{label}</span>
      <span style={{ fontSize: 13, color: colors.text }}>{value}</span>
    </div>
  );
}

const styles = {
  page: {
    padding: "20px 16px",
    background: colors.bg,
    minHeight: "100vh",
    boxSizing: "border-box",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 10,
  },
  title: { fontSize: 19, fontWeight: 700, color: colors.text },
  filters: { display: "flex", gap: 8, flexWrap: "wrap" },
  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: "7px 10px",
    background: colors.cardAlt,
  },
  searchInput: {
    border: "none",
    outline: "none",
    fontSize: 13,
    background: "none",
    color: colors.text,
    minWidth: 0,
  },
  select: {
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 13,
    background: colors.cardAlt,
    color: colors.text,
  },
  tableWrap: {
    border: `1px solid ${colors.border}`,
    borderRadius: 12,
    overflow: "hidden",
    background: colors.card,
    boxShadow: colors.shadow,
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    fontSize: 11.5,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    color: colors.textFaint,
    padding: "10px 14px",
    background: colors.cardAlt,
    borderBottom: `1px solid ${colors.border}`,
    whiteSpace: "nowrap",
  },
  tr: { borderBottom: `1px solid ${colors.border}` },
  td: {
    padding: "10px 14px",
    fontSize: 13,
    color: colors.text,
    whiteSpace: "nowrap",
  },
  logo: { width: 26, height: 26, borderRadius: 6, objectFit: "cover" },
  logoLarge: {
    width: 48,
    height: 48,
    borderRadius: 8,
    objectFit: "cover",
    border: `1px solid ${colors.border}`,
  },
  logoPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 6,
    background: colors.accent,
    color: "#fff",
    fontSize: 11,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoPlaceholderModal: {
    width: 48,
    height: 48,
    borderRadius: 8,
    border: `1.5px dashed ${colors.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: colors.cardAlt,
    flexShrink: 0,
  },
  logoReplaceBtn: {
    fontSize: 12.5,
    fontWeight: 600,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 7,
    padding: "7px 12px",
    cursor: "pointer",
    background: "#fff",
  },
  badgeGreen: {
    fontSize: 11.5,
    color: colors.green,
    background: colors.greenBg,
    padding: "2px 8px",
    borderRadius: 6,
    fontWeight: 600,
  },
  badgeMuted: { fontSize: 12.5, color: colors.textFaint },
  switch: {
    position: "relative",
    display: "inline-block",
    width: 36,
    height: 20,
    flexShrink: 0,
  },
  slider: {
    position: "absolute",
    inset: 0,
    borderRadius: 20,
    transition: "0.15s",
  },
  knob: {
    position: "absolute",
    top: 2,
    width: 16,
    height: 16,
    borderRadius: "50%",
    background: "#fff",
    transition: "0.15s",
    boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
  },
  iconBtnSm: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: `1px solid ${colors.border}`,
    background: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.textMuted,
    flexShrink: 0,
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    flexWrap: "wrap",
    gap: 10,
  },
  pageBtn: {
    border: `1px solid ${colors.border}`,
    background: colors.cardAlt,
    borderRadius: 6,
    padding: "6px 12px",
    fontSize: 12.5,
    cursor: "pointer",
    color: colors.text,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,17,23,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: 16,
    boxSizing: "border-box",
  },
  modal: {
    width: 460,
    maxWidth: "100%",
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: 14,
    padding: 18,
    boxShadow: colors.shadowLg,
    boxSizing: "border-box",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionCard: {
    background: colors.cardAlt,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    padding: 12,
  },
  detailList: { display: "flex", flexDirection: "column" },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: `1px solid ${colors.border}`,
    gap: 12,
  },
  modalInput: {
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    background: "#fff",
    color: colors.text,
    width: "100%",
    boxSizing: "border-box",
  },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    color: colors.text,
  },
  submitBtn: {
    background: colors.accent,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 0",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
  },
};
