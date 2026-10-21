import { useState } from "react";
import { Eye, EyeOff, ImagePlus, X, Check } from "lucide-react";
import api from "../../api/Axios";
import CategoryMultiSelect from "../../components/organizations/CategoryMultiSelect";
import AddressListInput from "../../components/organizations/AddressListInput";
// import ColorThemePicker from "../../components/organizations/ColorThemePicker";
import ThemeCustomizer from "../../components/organizations/ThemeCustomizer";

const colors = {
  bg: "#ffffff",
  card: "#f9fafb",
  border: "#e2e4e8",
  text: "#111318",
  textMuted: "#6b7280",
  textFaint: "#9ca3af",
  accent: "#111318",
  red: "#dc2626",
  redBg: "#fef2f2",
  redBorder: "#fecaca",
};

export default function CreateOrganization() {
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
    isLms: false,
    isEms: false,
    themeColor: "#1d4ed8",
  });

  const [themeColors, setThemeColors] = useState({
    accent: "#6366f1",
    sidebar: "#0e1220",
    header: "#0a0d16",
  });
  const [categoryIds, setCategoryIds] = useState([]);
  const [addresses, setAddresses] = useState([""]);
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleLogoChange = (file) => {
    setLogo(file || null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const removeLogo = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogo(null);
    setLogoPreview(null);
  };

  const resetForm = () => {
    setForm({
      name: "",
      phoneNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
      isLms: false,
      isEms: false,
      themeColor: "#1d4ed8",
    });
    setThemeColors({
      accent: "#6366f1",
      sidebar: "#0e1220",
      header: "#0a0d16",
    });
    setCategoryIds([]);
    setAddresses([""]);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogo(null);
    setLogoPreview(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.isLms && !form.isEms) {
      setError("Select at least LMS or EMS.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const fd = new FormData();
    fd.append("Name", form.name);
    fd.append("PhoneNumber", form.phoneNumber);
    fd.append("ThemeColor", themeColors.accent);
    fd.append("SidebarColor", themeColors.sidebar);
    fd.append("HeaderColor", themeColors.header);
    fd.append("IsLms", form.isLms);
    fd.append("IsEms", form.isEms);
    fd.append("Email", form.email);
    fd.append("Password", form.password);
    fd.append("ConfirmPassword", form.confirmPassword);
    categoryIds.forEach((id) => fd.append("CategoryIds", id));
    addresses.filter(Boolean).forEach((a) => fd.append("Addresses", a));
    if (logo) fd.append("Logo", logo);

    setLoading(true);
    try {
      await api.post("/central/organizations", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      resetForm();
      setSuccess("Organization created successfully.");
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0] || "Failed to create organization.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleModalOk = () => {
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={styles.page}>
      <style>{`
        .create-org-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: start;
        }
        .create-org-logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .create-org-check-row {
          display: flex;
          gap: 24px;
          align-items: center;
          flex-wrap: wrap;
        }

        @media (max-width: 640px) {
          .create-org-page { padding: 16px !important; }
          .create-org-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .create-org-title { font-size: 17px !important; }
        }
      `}</style>

      <div className="create-org-page" style={styles.pageInner}>
        <h1 className="create-org-title" style={styles.title}>
          Create Organization
        </h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="create-org-grid">
            <Field label="Organization Name">
              <input
                style={styles.input}
                value={form.name}
                onChange={set("name")}
                required
              />
            </Field>
            <Field label="Phone Number">
              <input
                style={styles.input}
                value={form.phoneNumber}
                onChange={set("phoneNumber")}
              />
            </Field>
          </div>

          <div className="create-org-grid">
            <CategoryMultiSelect
              selectedIds={categoryIds}
              onChange={setCategoryIds}
            />
            <ThemeCustomizer value={themeColors} onChange={setThemeColors} />
          </div>

          <AddressListInput addresses={addresses} onChange={setAddresses} />

          <Field label="Logo">
            <div className="create-org-logo-row">
              {logoPreview ? (
                <div style={styles.logoPreviewWrap}>
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    style={styles.logoPreviewImg}
                  />
                  <button
                    type="button"
                    style={styles.logoRemoveBtn}
                    onClick={removeLogo}
                    title="Remove logo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label style={styles.logoDropzone}>
                  <ImagePlus size={18} color={colors.textFaint} />
                  <span style={styles.logoDropzoneText}>Upload logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleLogoChange(e.target.files?.[0])}
                  />
                </label>
              )}

              {logoPreview && (
                <label style={styles.logoReplaceBtn}>
                  Change
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => handleLogoChange(e.target.files?.[0])}
                  />
                </label>
              )}
            </div>
          </Field>

          <div className="create-org-check-row">
            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={form.isLms}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isLms: e.target.checked }))
                }
              />
              LMS
            </label>
            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={form.isEms}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isEms: e.target.checked }))
                }
              />
              EMS
            </label>
          </div>

          <div style={styles.sectionTitle}>Login credentials</div>
          <div className="create-org-grid">
            <Field label="Email">
              <input
                type="email"
                style={styles.input}
                value={form.email}
                onChange={set("email")}
                required
              />
            </Field>
            <div />

            <Field label="Password">
              <div style={styles.passwordWrap}>
                <input
                  type={showPassword ? "text" : "password"}
                  style={styles.passwordInput}
                  value={form.password}
                  onChange={set("password")}
                  required
                />
                <button
                  type="button"
                  style={styles.eyeBtn}
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            <Field label="Confirm Password">
              <div style={styles.passwordWrap}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  style={styles.passwordInput}
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  required
                />
                <button
                  type="button"
                  style={styles.eyeBtn}
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </Field>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? "Creating..." : "Create Organization"}
          </button>
        </form>
      </div>

      {success && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.modalIconWrap}>
              <Check size={22} color="#fff" />
            </div>
            <div style={styles.modalTitle}>Success</div>
            <div style={styles.modalText}>{success}</div>
            <button
              type="button"
              style={styles.modalOkBtn}
              onClick={handleModalOk}
            >
              OK
            </button>
          </div>
        </div>
      )}
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

const styles = {
  page: {
    background: colors.bg,
    minHeight: "100vh",
  },
  pageInner: {
    padding: 28,
    maxWidth: 780,
    margin: "0 auto",
    color: colors.text,
    boxSizing: "border-box",
  },
  title: {
    fontSize: 19,
    fontWeight: 700,
    color: colors.text,
    marginBottom: 20,
  },
  form: { display: "flex", flexDirection: "column", gap: 18 },
  input: {
    width: "100%",
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: "9px 11px",
    fontSize: 13,
    boxSizing: "border-box",
    background: colors.bg,
    color: colors.text,
    outline: "none",
  },
  logoDropzone: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    border: `1.5px dashed ${colors.border}`,
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    color: colors.textMuted,
    fontSize: 13,
    background: colors.card,
  },
  logoDropzoneText: { fontSize: 13, color: colors.textMuted },
  logoPreviewWrap: {
    position: "relative",
    width: 64,
    height: 64,
    borderRadius: 8,
    border: `1px solid ${colors.border}`,
    overflow: "hidden",
    flexShrink: 0,
  },
  logoPreviewImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  logoRemoveBtn: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  logoReplaceBtn: {
    fontSize: 12.5,
    fontWeight: 600,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    borderRadius: 7,
    padding: "7px 12px",
    cursor: "pointer",
  },
  passwordWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  passwordInput: {
    width: "100%",
    border: `1px solid ${colors.border}`,
    borderRadius: 8,
    padding: "9px 38px 9px 11px",
    fontSize: 13,
    boxSizing: "border-box",
    background: colors.bg,
    color: colors.text,
    outline: "none",
  },
  eyeBtn: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    width: 26,
    height: 26,
    border: "none",
    background: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.textMuted,
    padding: 0,
  },
  checkLabel: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    fontSize: 13,
    color: colors.text,
    cursor: "pointer",
  },
  checkbox: {
    width: 15,
    height: 15,
    accentColor: colors.accent,
    cursor: "pointer",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: colors.text,
    borderTop: `1px solid ${colors.border}`,
    paddingTop: 16,
  },
  error: {
    fontSize: 13,
    color: colors.red,
    background: colors.redBg,
    border: `1px solid ${colors.redBorder}`,
    borderRadius: 8,
    padding: "9px 12px",
  },
  submitBtn: {
    background: colors.accent,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "11px 0",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,17,23,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
    padding: 16,
    boxSizing: "border-box",
  },
  modalBox: {
    width: 320,
    maxWidth: "100%",
    background: "#ffffff",
    borderRadius: 14,
    padding: "26px 22px 22px",
    boxShadow: "0 24px 60px rgba(16,20,30,0.22)",
    textAlign: "center",
    boxSizing: "border-box",
  },
  modalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: "#059669",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 14px",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.text,
    marginBottom: 6,
  },
  modalText: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 18,
  },
  modalOkBtn: {
    background: colors.accent,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 24px",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
  },
};
