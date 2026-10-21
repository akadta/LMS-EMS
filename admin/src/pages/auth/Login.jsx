import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../api/Axios";

const COLORS = {
  brand: "#1d4ed8",
  brandDark: "#152a63",
  text: "#0f172a",
  textMuted: "#64748b",
  border: "#e2e8f0",
  bg: "#ffffff",
  panelBg: "#f8fafc",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/central/login", { email, password });
      const { token, userId, name, systemRoleSlug, roleSlug } = res.data.data;

      localStorage.setItem("central_token", token);
      localStorage.setItem(
        "central_user",
        JSON.stringify({ userId, name, email, systemRoleSlug, roleSlug }),
      );

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0] ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-root" style={styles.page}>
      <style>{`
        .login-input {
          transition: border-color 0.12s ease, box-shadow 0.12s ease;
        }
        .login-input:focus {
          outline: none;
          border-color: ${COLORS.brand} !important;
          box-shadow: 0 0 0 3px rgba(29,78,216,0.12) !important;
        }
        .login-btn {
          transition: background 0.12s ease;
        }
        .login-btn:hover:not(:disabled) {
          background: ${COLORS.brandDark} !important;
        }
        .login-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
        .eye-btn {
          transition: color 0.12s ease;
        }
        .eye-btn:hover {
          color: ${COLORS.text} !important;
        }
        @media (max-width: 768px) {
          .login-side-panel {
            flex: 0 0 auto !important;
            width: 100% !important;
            padding: 32px 24px !important;
            min-height: 0 !important;
          }
          .login-side-panel p { display: none; }
          .login-side-panel h2 { font-size: 20px !important; margin-bottom: 0 !important; }
          .login-page-root { flex-direction: column !important; }
          .login-form-panel { padding: 32px 24px !important; }
        }
      `}</style>

      <div className="login-side-panel" style={styles.sidePanel}>
        <div>
          <h2 style={styles.sideTitle}>ProxErp</h2>
        </div>
      </div>

      <div className="login-form-panel" style={styles.formPanel}>
        <div style={styles.formWrap}>
          <h1 style={styles.title}>Sign in</h1>
          <p style={styles.subtitle}>
            Enter your credentials to access your account.
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="login-input"
                style={styles.input}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="password">
                Password
              </label>
              <div style={styles.passwordWrap}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="login-input"
                  style={{ ...styles.input, paddingRight: 40 }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword((s) => !s)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div style={styles.row}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={styles.checkbox}
                />
                Remember me
              </label>
              <a href="#forgot" style={styles.link}>
                Forgot password?
              </a>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <button
              type="submit"
              className="login-btn"
              style={styles.button}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    maxWidth: "100vw",
    display: "flex",
    flexWrap: "nowrap",
    background: COLORS.bg,
    overflowX: "hidden",
    boxSizing: "border-box",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  },
  sidePanel: {
    flex: "0 0 42%",
    background: `linear-gradient(160deg, ${COLORS.brand}, ${COLORS.brandDark})`,
    color: "#fff",
    padding: "56px 48px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxSizing: "border-box",
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 10,
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.02em",
    marginBottom: 32,
  },
  sideTitle: {
    fontSize: 26,
    fontWeight: 600,
    lineHeight: 1.3,
    margin: "0 0 14px",
    letterSpacing: "-0.01em",
    maxWidth: 320,
  },
  sideText: {
    fontSize: 14.5,
    lineHeight: 1.6,
    color: "rgba(255,255,255,0.75)",
    maxWidth: 300,
    margin: 0,
  },
  sideFooter: {
    fontSize: 12.5,
    color: "rgba(255,255,255,0.5)",
    margin: 0,
  },
  formPanel: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    boxSizing: "border-box",
  },
  formWrap: {
    width: "100%",
    maxWidth: 360,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.text,
    margin: "0 0 6px",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    fontSize: 13.5,
    color: COLORS.textMuted,
    margin: "0 0 28px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.text,
  },
  passwordWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    background: COLORS.bg,
    color: COLORS.text,
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    right: 10,
    background: "none",
    border: "none",
    padding: 4,
    cursor: "pointer",
    color: COLORS.textMuted,
    display: "flex",
    alignItems: "center",
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 13,
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    color: COLORS.text,
    cursor: "pointer",
    userSelect: "none",
  },
  checkbox: {
    width: 15,
    height: 15,
    accentColor: COLORS.brand,
    cursor: "pointer",
  },
  link: {
    color: COLORS.brand,
    textDecoration: "none",
    fontWeight: 500,
  },
  error: {
    fontSize: 13,
    color: "#b91c1c",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "8px 12px",
  },
  button: {
    marginTop: 4,
    padding: "11px 0",
    fontSize: 14.5,
    fontWeight: 600,
    color: "#fff",
    background: COLORS.brand,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};
