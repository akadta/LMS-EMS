import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/Axios";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const res = await api.post("/user/login", form);
      const { data } = res.data;

      localStorage.setItem("user_token", data.token);
      localStorage.setItem("user_user", JSON.stringify(data));

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setErrors(
        apiErrors?.length
          ? apiErrors
          : ["Something went wrong. Please try again."],
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page d-flex min-vh-100">
      <style>{`
        .login-page {
          font-family: "Inter", system-ui, sans-serif;
          background: #fff;
        }

        .login-form-inner { max-width: 380px; }

        .brand-mark {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #1d4ed8;
        }
        .brand-name {
          font-size: 17px;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.01em;
        }

        .login-title {
          font-size: 28px;
          font-weight: 600;
          color: #0f172a;
          letter-spacing: -0.01em;
        }
        .login-subtitle { font-size: 15px; color: #64748b; }

        .login-alert { font-size: 13px; border-radius: 8px; }

        .login-label {
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          margin-bottom: 6px;
        }

        .login-input {
          font-size: 14px;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #0f172a;
        }
        .login-input::placeholder { color: #94a3b8; }
        .login-input:focus {
          border-color: #1d4ed8;
          box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.12);
        }

        .login-eye-btn {
          color: #94a3b8;
          padding: 0;
          right: 12px !important;
          border: none;
          background: transparent;
        }
        .login-eye-btn:hover { color: #475569; }

        .login-checkbox {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border-color: #cbd5e1;
        }
        .login-checkbox:checked {
          background-color: #1d4ed8;
          border-color: #1d4ed8;
        }
        .login-checkbox:focus {
          box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.15);
        }

        .login-remember-label { font-size: 13.5px; color: #475569; }

        .login-link {
          font-size: 13px;
          font-weight: 500;
          color: #1d4ed8;
          text-decoration: none;
        }
        .login-link:hover { color: #1e40af; text-decoration: underline; }

        .login-submit-btn {
          background: #1d4ed8;
          color: #fff;
          font-size: 14.5px;
          font-weight: 500;
          padding: 10px 0;
          border-radius: 8px;
          border: none;
          box-shadow: 0 2px 6px rgba(29, 78, 216, 0.25);
          transition: background 0.15s ease;
        }
        .login-submit-btn:hover:not(:disabled) { background: #1e40af; }
        .login-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .login-footer-text { font-size: 12.5px; color: #94a3b8; }

        /* ---- Right side ---- */
        .login-illustration-side {
          width: 55%;
          background: linear-gradient(135deg, #1d4ed8 0%, #1e293b 100%);
          overflow: hidden;
        }

        .illustration-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .illustration-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(29, 78, 216, 0.82) 0%,
            rgba(15, 23, 42, 0.88) 100%
          );
        }

        .float-card {
          position: absolute;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 12px 16px;
        }
        .float-card-1 { top: 64px; left: 64px; width: 160px; }
        .float-card-2 { bottom: 96px; left: 96px; width: 145px; }

        .float-bar { height: 8px; border-radius: 4px; background: rgba(255,255,255,0.4); }
        .float-bar-lg { width: 65px; }
        .float-bar-md { width: 55px; }
        .float-bar-sm { width: 40px; background: rgba(255,255,255,0.25); }
        .float-bar-xs { width: 36px; background: rgba(255,255,255,0.25); }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6ee7b7;
          display: inline-block;
        }

        .illustration-svg { z-index: 1; }

        .illustration-caption {
          bottom: 56px;
          left: 0;
          right: 0;
        }
        .illustration-caption-title { color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 500; }
        .illustration-caption-sub { color: rgba(255,255,255,0.5); font-size: 13px; }

        @media (max-width: 991.98px) {
          .login-illustration-side { display: none; }
        }
      `}</style>

      {/* Left: Form */}
      <div className="d-flex flex-column justify-content-center px-4 px-sm-5 py-5 w-100">
        <div className="mx-auto w-100 login-form-inner">
          <div className="d-flex align-items-center gap-2 mb-5">
            <div className="brand-mark d-flex align-items-center justify-content-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 12L10 18L20 6"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="brand-name">Learn</span>
          </div>

          <h1 className="login-title mb-2">Welcome back</h1>
          <p className="login-subtitle mb-4">
            Sign in to your account to continue.
          </p>

          {errors.length > 0 && (
            <div
              className="alert alert-danger py-2 px-3 login-alert"
              role="alert"
            >
              {errors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label login-label">Email address</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@company.com"
                className="form-control login-input"
              />
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label login-label mb-0">Password</label>
                <a href="/forgot-password" className="login-link">
                  Forgot password?
                </a>
              </div>
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="form-control login-input pe-5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="btn login-eye-btn position-absolute top-50 end-0 translate-middle-y"
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 3L21 21M10.5 10.7A2.5 2.5 0 0013.3 13.5M6.6 6.6C4.5 8 3 10 3 12c0 0 3.5 7 9 7 1.8 0 3.4-.6 4.7-1.5M9.9 4.6A9.5 9.5 0 0112 4.5c5.5 0 9 7 9 7-.5 1-1.3 2.3-2.4 3.5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="2.7"
                        stroke="currentColor"
                        strokeWidth="1.7"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-check d-flex align-items-center gap-2 mb-4 mt-1">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="form-check-input login-checkbox m-0"
              />
              <label
                htmlFor="remember"
                className="form-check-label login-remember-label m-0"
              >
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn login-submit-btn w-100"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>

      {/* Right: Illustration panel */}
      <div className="login-illustration-side d-none d-lg-flex align-items-center justify-content-center position-relative">
        <img
          src="https://cdn.pixabay.com/photo/2016/03/27/20/12/desk-1284085_1280.jpg"
          alt="Laptop open on a desk"
          className="illustration-photo"
        />
        <div className="illustration-overlay" />

        <div className="float-card float-card-1">
          <div className="float-bar float-bar-lg mb-2" />
          <div className="float-bar float-bar-sm" />
        </div>
        <div className="float-card float-card-2">
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="status-dot" />
            <div className="float-bar float-bar-md" />
          </div>
          <div className="float-bar float-bar-xs" />
        </div>

        <div className="illustration-caption position-absolute text-center px-5">
          <p className="illustration-caption-title mb-1">
            One workspace for every exam, every result.
          </p>
          <p className="illustration-caption-sub mb-0">
            Trusted by teams managing thousands of assessments daily.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
