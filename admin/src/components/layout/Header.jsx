import { useState, useRef, useEffect } from "react";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings2,
} from "lucide-react";
import { C } from "../../theme/colors";
import { useNavigate } from "react-router-dom";

export default function Header({ collapsed, onToggleSidebar }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem("central_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const displayName = currentUser?.name || "User";
  const displayEmail = currentUser?.email || "";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const displayRole =
    currentUser?.roleSlug || currentUser?.systemRoleSlug || "";

  useEffect(() => {
    function onClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header
      className={`app-topbar${collapsed ? " collapsed" : ""}`}
      style={styles.topbar}
    >
      <style>{`
        .dropdown-item:hover { background: rgba(255,255,255,0.05); }
        .icon-btn:hover { background: rgba(255,255,255,0.06); }
        input::placeholder { color: ${C.textFaint}; }
        input:focus { outline: none; }

        .app-topbar { left: 250px; transition: left 0.2s ease; }
        .app-topbar.collapsed { left: 76px; }
        .mobile-logo { display: none; }
        .mobile-toggle-btn { display: none; }

        @media (max-width: 900px) {
          .app-topbar, .app-topbar.collapsed { left: 0 !important; }
          .mobile-logo { display: flex !important; }
          .mobile-toggle-btn { display: flex !important; }
        }
        @media (max-width: 640px) {
          .search-input { display: none !important; }
          .topbar-title { display: none !important; }
        }
      `}</style>

      <button
        className="icon-btn mobile-toggle-btn"
        style={styles.toggleBtn}
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu size={19} />
      </button>

      <div className="mobile-logo" style={styles.mobileLogo}></div>

      <div style={styles.topbarRight}>
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            style={styles.profileBtn}
            onClick={() => setProfileOpen((o) => !o)}
          >
            <div style={styles.avatar}>{initials}</div>
            <div style={styles.profileText}>
              <span style={styles.profileName}>{displayName}</span>
              <span style={styles.profileRole}>{displayRole}</span>
            </div>
            <ChevronDown
              size={14}
              color={C.textFaint}
              style={{
                transform: profileOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.15s",
              }}
            />
          </button>

          {profileOpen && (
            <div style={styles.dropdown}>
              <div style={styles.dropdownHead}>
                <div style={styles.avatar}>{initials}</div>
                <div>
                  <div style={styles.profileName}>{displayName}</div>
                  <div style={styles.dropdownEmail}>{displayEmail}</div>
                </div>
              </div>
              <div style={styles.dropdownDivider} />
              {/* <button className="dropdown-item" style={styles.dropdownItem}>
                <User size={15} /> Profile
              </button>
              <button className="dropdown-item" style={styles.dropdownItem}>
                <Settings2 size={15} /> Account settings
              </button> */}
              <div style={styles.dropdownDivider} />
              <button
                className="dropdown-item"
                style={{ ...styles.dropdownItem, color: C.red }}
                onClick={() => {
                  localStorage.removeItem("central_token");
                  localStorage.removeItem("central_user");
                  navigate("/");
                }}
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const styles = {
  topbar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "14px 24px",
    borderBottom: `1px solid ${C.border}`,
    position: "fixed",
    top: 0,
    right: 0,
    background: C.bg,
    zIndex: 30,
  },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    background: "none",
    border: `1px solid ${C.border}`,
    color: C.text,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  mobileLogo: { display: "none", alignItems: "center", gap: 8 },
  logoMarkSm: {
    width: 26,
    height: 26,
    borderRadius: 7,
    background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  logoTextSm: { fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" },
  topbarTitle: { fontSize: 16, fontWeight: 600, marginRight: 8 },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 9,
    padding: "8px 12px",
    flex: 1,
    maxWidth: 340,
  },
  searchInput: {
    background: "none",
    border: "none",
    color: C.text,
    fontSize: 13.5,
    width: "100%",
  },
  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginLeft: "auto",
  },
  iconBtn: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 9,
    background: "none",
    border: `1px solid ${C.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: C.red,
  },
  profileBtn: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    background: "none",
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: "5px 10px 5px 5px",
    cursor: "pointer",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11.5,
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
  },
  profileText: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  profileName: { fontSize: 13, fontWeight: 600, color: C.text },
  profileRole: { fontSize: 11.5, color: C.textFaint },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: 0,
    width: 230,
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: 8,
    boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
    zIndex: 60,
  },
  dropdownHead: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 6px 10px",
  },
  dropdownEmail: { fontSize: 11.5, color: C.textFaint, marginTop: 2 },
  dropdownDivider: { height: 1, background: C.border, margin: "4px 0" },
  dropdownItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    padding: "8px 8px",
    background: "none",
    border: "none",
    borderRadius: 7,
    color: C.textMuted,
    fontSize: 13,
    cursor: "pointer",
    textAlign: "left",
  },
};
