import { useState, useEffect, useCallback } from "react";
import { Search, Eye, Pencil, X, ImagePlus, Plus, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../api/Axios";
import { useOrgTheme } from "../../context/ThemeContext";
import { resolveImageUrl } from "../../utils/resolveImageUrl";

const colors = {
  bg: "#ffffff",
  card: "#ffffff",
  cardAlt: "#f8f9fb",
  border: "#e6e7eb",
  borderStrong: "#d8dade",
  text: "#111318",
  textMuted: "#6b7280",
  textFaint: "#9ca3af",
  accent: "#16213e",
  red: "#dc2626",
  redBg: "#fef2f2",
  shadow: "0 1px 2px rgba(16,20,30,0.04)",
  shadowLg: "0 24px 60px rgba(16,20,30,0.18)",
};

export default function CompanyManage() {
  const navigate = useNavigate();
  const { orgContext } = useOrgTheme() || {};

  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [modalMode, setModalMode] = useState(null); // "create" | companyId | null
  const load = useCallback(async () => {
    const res = await api.get(`/user/companies`, {
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
    await api.patch(`/user/companies/${id}/toggle-active`);
    load();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  if (orgContext && orgContext.role !== "organization") {
    return (
      <div style={styles.page}>
        <div style={{ color: colors.textFaint, fontSize: 13.5 }}>
          Only organization accounts can view all companies.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{`
        .switch-input { opacity: 0; width: 0; height: 0; position: absolute; }
        .cm-row:hover { background: ${colors.cardAlt}; }
        .icon-btn-sm:hover { background: ${colors.cardAlt}; }
        .search-box input::placeholder { color: ${colors.textFaint}; }
        .search-box input:focus { outline: none; }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .cm-table-scroll { overflow-x: auto; overflow-y: auto; max-height: 65vh; -webkit-overflow-scrolling: touch; }
        .cm-table-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
        .cm-table-scroll::-webkit-scrollbar-track { background: transparent; }
        .cm-table-scroll::-webkit-scrollbar-thumb { background: ${colors.borderStrong}; border-radius: 8px; }
        .cm-table { min-width: 780px; }
        @media (max-width: 720px) {
          .cm-header-row { flex-direction: column; align-items: stretch !important; }
          .cm-filters { flex-direction: column; }
          .cm-filters .search-box { width: 100%; }
          .cm-filters select { width: 100%; }
        }
        .cm-modal-scroll { max-height: 82vh; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        @media (max-width: 520px) { .cm-modal { width: 94vw !important; max-width: 94vw !important; } }
        .cm-name-link:hover { text-decoration: underline; }
      `}</style>

      <div className="cm-header-row" style={styles.headerRow}>
        <h1 style={styles.title}>Companies</h1>
        <div className="cm-filters" style={styles.filters}>
          <div className="search-box" style={styles.searchBox}>
            <Search size={14} color={colors.textFaint} />
            <input
              type="text"
              name="company-search-query"
              autoComplete="off"
              placeholder="Search company or admin"
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
          {orgContext && orgContext.role === "organization" && (
            <button
              className="add-btn"
              style={styles.addBtn}
              onClick={() => setModalMode("create")}
            >
              <Plus size={15} /> Add Company
            </button>
          )}
        </div>
      </div>

      <div style={styles.tableWrap}>
        <div className="cm-table-scroll">
          <table className="cm-table" style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, position: "sticky", top: 0 }}>
                  Company
                </th>
                <th style={{ ...styles.th, position: "sticky", top: 0 }}>
                  Admin
                </th>
                <th style={{ ...styles.th, position: "sticky", top: 0 }}>
                  Email
                </th>
                <th style={{ ...styles.th, position: "sticky", top: 0 }}>
                  Phone
                </th>
                <th style={{ ...styles.th, position: "sticky", top: 0 }}>
                  Departments
                </th>
                <th style={{ ...styles.th, position: "sticky", top: 0 }}>
                  Status
                </th>
                <th style={{ ...styles.th, position: "sticky", top: 0 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="cm-row" style={styles.tr}>
                  <td style={styles.td}>
                    <div
                      className="cm-name-link"
                      onClick={() => navigate(`/companies/${c.id}/departments`)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                      }}
                    >
                      {c.logoUrl ? (
                        <img
                          src={resolveImageUrl(c.logoUrl)}
                          alt=""
                          style={styles.logo}
                        />
                      ) : (
                        <div style={styles.logoPlaceholder}>{c.name[0]}</div>
                      )}
                      <span style={{ color: colors.accent, fontWeight: 600 }}>
                        {c.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...styles.td, color: colors.textMuted }}>
                    {c.adminName}
                  </td>
                  <td style={{ ...styles.td, color: colors.textMuted }}>
                    {c.email}
                  </td>
                  <td style={{ ...styles.td, color: colors.textMuted }}>
                    {c.phoneNumber || "—"}
                  </td>
                  <td style={{ ...styles.td, color: colors.textMuted }}>
                    {c.departmentCount}
                  </td>
                  <td style={styles.td}>
                    <label className="switch" style={styles.switch}>
                      <input
                        className="switch-input"
                        type="checkbox"
                        checked={c.isActive}
                        onChange={() => toggleActive(c.id)}
                      />
                      <span
                        style={{
                          ...styles.slider,
                          background: c.isActive
                            ? colors.accent
                            : colors.border,
                        }}
                      >
                        <span
                          style={{ ...styles.knob, left: c.isActive ? 18 : 2 }}
                        />
                      </span>
                    </label>
                  </td>
                  <td style={styles.td}>
                    <button
                      className="icon-btn-sm"
                      style={styles.iconBtnSm}
                      onClick={() => setModalMode(c.id)}                    >
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
                    No companies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={styles.pagination}>
        <span style={{ fontSize: 12.5, color: colors.textFaint }}>
          {totalCount} companies · Page {page} of {totalPages}
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

      {modalMode !== null && (
        <CompanyEditModal
          mode={modalMode}
          onClose={() => setModalMode(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

function CompanyEditModal({ mode, onClose, onSaved }) {
  const isCreate = mode === "create";
  const [detail, setDetail] = useState(null);
  const [editMode, setEditMode] = useState(isCreate);
  const [form, setForm] = useState({
    name: "",
    adminName: "",
    phoneNumber: "",
    address: "",
    place: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isCreate) return;
    api.get(`/user/companies/${mode}`).then((res) => {
      const d = res.data.data;
      setDetail(d);
      setForm({
        name: d.name,
        adminName: d.adminName,
        phoneNumber: d.phoneNumber || "",
        address: d.address || "",
        place: d.place || "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setLogoPreview(resolveImageUrl(d.logoUrl));
    });
  }, [isCreate, mode]);

  const handleLogoChange = (file) => {
    if (!file) return;
    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const fe = {};
    if (!form.name.trim()) fe.name = "Company name is required.";
    if (!form.adminName.trim()) fe.adminName = "Admin name is required.";
    if (!form.phoneNumber.trim()) fe.phoneNumber = "Phone number is required.";
    if (!form.address.trim()) fe.address = "Address is required.";
    if (!form.place.trim()) fe.place = "Place is required.";

    if (isCreate) {
      if (!form.email.trim()) fe.email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
        fe.email = "Enter a valid email.";
      if (!form.password) fe.password = "Password is required.";
      else if (form.password.length < 6) fe.password = "Minimum 6 characters.";
      if (form.confirmPassword !== form.password)
        fe.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const save = async () => {
    setErrors([]);
    if (!validate()) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("Name", form.name);
      fd.append("AdminName", form.adminName);
      fd.append("PhoneNumber", form.phoneNumber);
      fd.append("Address", form.address);
      fd.append("Place", form.place);
    if (logo) fd.append("Logo", logo);

      if (isCreate) {
        fd.append("Email", form.email);
        fd.append("Password", form.password);
        fd.append("ConfirmPassword", form.confirmPassword);
        await api.post(`/user/companies`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.put(`/user/companies/${mode}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setErrors(
        apiErrors?.length
          ? apiErrors
          : ["Something went wrong. Please try again."],
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isCreate && !detail) return null;
  return (
    <div style={styles.modalOverlay}>
      <div
        className="cm-modal"
        style={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.modalHeader}>
           <span style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>
            {isCreate ? "Add Company" : detail.name}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            {!isCreate && !editMode && (
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

        <div className="cm-modal-scroll">
          {errors.length > 0 && (
            <div style={styles.errorBanner}>
              {errors.map((e, i) => (
                <div key={i}>{e}</div>
              ))}
            </div>
          )}

          {!isCreate && !editMode ? (
                        <div style={styles.detailList}>
              <DetailRow label="Admin Name" value={detail.adminName} />
              <DetailRow label="Email" value={detail.email} />
              <DetailRow label="Phone" value={detail.phoneNumber || "—"} />
              <DetailRow label="Address" value={detail.address || "—"} />
              <DetailRow label="Place" value={detail.place || "—"} />
              <DetailRow
                label="Departments"
                value={String(detail.departmentCount)}
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
                    src={resolveImageUrl(detail.logoUrl)}
                    alt=""
                    style={styles.logoLarge}
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

              <Field label="Company Name" error={fieldErrors.name}>
                <input
                  style={inputStyle(fieldErrors.name)}
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Company name"
                />
              </Field>

              <Field label="Admin Name" error={fieldErrors.adminName}>
                <input
                  style={inputStyle(fieldErrors.adminName)}
                  value={form.adminName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, adminName: e.target.value }))
                  }
                  placeholder="Admin name"
                />
              </Field>

              <Field label="Phone Number">
                <input
                  style={inputStyle(false)}
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phoneNumber: e.target.value }))
                  }
                  placeholder="Phone number"
                />
              </Field>

              <Field label="Address">
                <textarea
                  style={{
                    ...inputStyle(false),
                    resize: "vertical",
                    minHeight: 60,
                  }}
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="Address"
                />
              </Field>

               <Field label="Place" error={fieldErrors.place}>
                <input
                  style={inputStyle(fieldErrors.place)}
                  value={form.place}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, place: e.target.value }))
                  }
                  placeholder="Place"
                />
              </Field>

              {isCreate && (
                <>
                  <Field label="Email" error={fieldErrors.email}>
                    <input
                      style={inputStyle(fieldErrors.email)}
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      placeholder="Email"
                      type="email"
                    />
                  </Field>

                  <Field label="Password" error={fieldErrors.password}>
                    <div style={styles.passwordWrap}>
                      <input
                        style={{ ...inputStyle(fieldErrors.password), paddingRight: 36 }}
                        value={form.password}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, password: e.target.value }))
                        }
                        placeholder="Password"
                        type={showPassword ? "text" : "password"}
                      />
                      <button
                        type="button"
                        style={styles.eyeBtn}
                        onClick={() => setShowPassword((s) => !s)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirm Password" error={fieldErrors.confirmPassword}>
                    <div style={styles.passwordWrap}>
                      <input
                        style={{ ...inputStyle(fieldErrors.confirmPassword), paddingRight: 36 }}
                        value={form.confirmPassword}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                        }
                        placeholder="Confirm password"
                        type={showConfirmPassword ? "text" : "password"}
                      />
                      <button
                        type="button"
                        style={styles.eyeBtn}
                        onClick={() => setShowConfirmPassword((s) => !s)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>
                </>
              )}

              <button
                style={{
                  ...styles.submitBtn,
                  width: "100%",
                  boxSizing: "border-box",
                }}
                onClick={save}
                disabled={saving}
              >
                {saving ? "Saving..." : isCreate ? "Register Company" : "Save changes"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function inputStyle(hasError) {
  return {
    ...styles.modalInput,
    borderColor: hasError ? colors.red : colors.border,
  };
}

function Field({ label, children, error }) {
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
      {error && (
        <span
          style={{
            fontSize: 11.5,
            color: colors.red,
            marginTop: 4,
            display: "block",
          }}
        >
          {error}
        </span>
      )}
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
  filters: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
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
  addBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    background: colors.accent,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
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
    fontFamily: "inherit",
  },
 passwordWrap: {
    position: "relative",
    width: "100%",
  },
  eyeBtn: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "none",
    cursor: "pointer",
    color: colors.textFaint,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  errorBanner: {
    background: colors.redBg,
    border: `1px solid ${colors.red}`,
    color: colors.red,
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 12.5,
    marginBottom: 12,
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
