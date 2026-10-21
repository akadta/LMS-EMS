import { useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown, Menu, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOrgTheme } from "../context/ThemeContext";
import { resolveImageUrl } from "../utils/resolveImageUrl";

const TOPBAR_STYLES = `
.lms-icon-btn { display:flex; align-items:center; justify-content:center; width:36px; height:36px; border-radius:10px; border:none; background:transparent; color:rgba(255,255,255,0.65); cursor:pointer; transition:background .15s ease,color .15s ease; position:relative; flex-shrink:0; }
.lms-icon-btn:hover { background:rgba(255,255,255,0.08); color:#fff; }
.lms-bell-dot { position:absolute; top:7px; right:7px; width:7px; height:7px; border-radius:50%; background:#ff5c5c; box-shadow:0 0 0 2px var(--header-bg); }
.lms-search { display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:999px; padding:8px 12px; width:230px; transition:border-color .15s ease,background .15s ease; box-sizing:border-box; }
.lms-search:focus-within { border-color:rgba(var(--accent-rgb),0.55); background:rgba(255,255,255,0.09); }
.lms-search input { background:none; border:none; outline:none; color:#fff; font-size:13px; width:100%; }
.lms-search input::placeholder { color:rgba(255,255,255,0.35); }
.lms-search kbd { font-size:10.5px; color:rgba(255,255,255,0.32); background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:5px; padding:1.5px 5px; font-family:inherit; flex-shrink:0; }
.lms-avatar-btn { display:flex; align-items:center; gap:8px; padding:4px 8px 4px 4px; border-radius:999px; cursor:pointer; transition:background .15s ease; }
.lms-avatar-btn:hover { background:rgba(255,255,255,0.06); }
.lms-topbar-org { color:#fff; font-weight:700; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.lms-topbar-caption { color:rgba(255,255,255,0.35); font-size:10.5px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; margin-top:1px; }
@media (max-width: 900px) { .lms-search { display:none; } }
`;

export default function Topbar({ onToggleSidebar }) {
  const { orgContext } = useOrgTheme() || {};
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user_token");
    localStorage.removeItem("user_user");
    // clear whatever else you store (org context, refresh token, etc.)
    navigate("/");
  };

  const roleLabel = orgContext?.role
    ? orgContext.role.charAt(0).toUpperCase() + orgContext.role.slice(1)
    : "";

  return (
    <header
      style={{
        height: 64,
        background: "var(--header-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        position: "sticky",
        top: 0,
        zIndex: 10,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        boxSizing: "border-box",
      }}
    >
      <style>{TOPBAR_STYLES}</style>

      <div
        style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}
      >
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lms-icon-btn"
        >
          <Menu size={18} />
        </button>

        {orgContext?.logoUrl ? (
          <img
            src={resolveImageUrl(orgContext.logoUrl)}
            alt="logo"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              objectFit: "cover",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--accent)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              flexShrink: 0,
            }}
          />
        )}

        <div style={{ minWidth: 0 }}>
          <div className="lms-topbar-org">
            {orgContext?.organizationName || "Loading..."}
          </div>
          <div className="lms-topbar-caption">Admin Panel</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* <label className="lms-search">
          <Search size={14} color="rgba(255,255,255,0.4)" />
          <input type="text" placeholder="Search..." />
          <kbd>⌘K</kbd>
        </label> */}

        {/* <button
          type="button"
          className="lms-icon-btn"
          aria-label="Notifications"
        >
          <Bell size={17} />
          <span className="lms-bell-dot" />
        </button> */}

        <div ref={menuRef} style={{ position: "relative" }}>
          <div
            className="lms-avatar-btn"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {orgContext?.logoUrl ? (
              <img
                src={resolveImageUrl(orgContext.logoUrl)}
                alt="avatar"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  objectFit: "cover",
                  boxShadow:
                    "0 0 0 2px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.35)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--accent), rgba(var(--accent-rgb), 0.55))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow:
                    "0 0 0 2px rgba(255,255,255,0.12), 0 2px 8px rgba(0,0,0,0.35)",
                  flexShrink: 0,
                }}
              >
                {(orgContext?.entityName || "U")[0]?.toUpperCase()}
              </div>
            )}
            <ChevronDown
              size={14}
              color="rgba(255,255,255,0.6)"
              style={{
                transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.15s ease",
              }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              top: 46,
              right: 0,
              minWidth: 200,
              background: "rgba(22,22,32,0.98)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 14,
              boxShadow: "0 16px 36px rgba(0,0,0,0.45)",
              overflow: "hidden",
              zIndex: 100,
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen
                ? "translateY(0) scale(1)"
                : "translateY(-6px) scale(0.97)",
              transformOrigin: "top right",
              pointerEvents: menuOpen ? "auto" : "none",
              transition: "opacity 0.15s ease, transform 0.15s ease",
            }}
          >
            <div
              style={{
                padding: "14px 14px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  color: "#fff",
                  fontSize: 13.5,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {orgContext?.entityName || "User"}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 12,
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {orgContext?.entityEmail || ""}
              </div>
              {roleLabel && (
                <div
                  style={{
                    display: "inline-block",
                    marginTop: 8,
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "var(--accent)",
                    background: "rgba(var(--accent-rgb), 0.16)",
                  }}
                >
                  {roleLabel}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                navigate("/profile");
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "none",
                border: "none",
                padding: "10px 14px",
                color: "rgba(255,255,255,0.85)",
                fontSize: 13.5,
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <User size={14} />
              Profile
            </button>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "none",
                border: "none",
                padding: "10px 14px",
                color: "#ff6b6b",
                fontSize: 13.5,
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,107,107,0.08)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
