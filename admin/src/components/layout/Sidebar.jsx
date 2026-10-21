import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, PanelLeftClose } from "lucide-react";
import { C } from "../../theme/colors";
import { NAV, BOTTOM_NAV } from "../../config/navigation";

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);

  // Auto-expand the parent menu whenever the current route matches one of its children
  useEffect(() => {
    const parentWithActiveChild = NAV.find((item) =>
      item.children?.some((child) => location.pathname === child.href),
    );
    if (parentWithActiveChild) setOpenMenu(parentWithActiveChild.key);
  }, [location.pathname]);

  const toggleMenu = (key) =>
    setOpenMenu((prev) => (prev === key ? null : key));

  const isItemActive = (item) =>
    location.pathname === item.href ||
    !!item.children?.some((child) => location.pathname === child.href);

  return (
    <aside
      className={`sidebar-fixed${collapsed ? " collapsed" : ""}`}
      style={styles.sidebar}
    >
      <style>{`
        .navitem, .subitem { text-decoration: none; display: flex; }
        .navitem:hover { background: rgba(255,255,255,0.04); color: ${C.text} !important; }
        .navitem.active { background: ${C.accentSoft}; color: #fff !important; }
        .navitem.active .navicon { color: ${C.accent} !important; }
        .subitem:hover { color: ${C.text} !important; }
        .subitem.active { color: #fff !important; }
        .subitem.active::before { background: ${C.accent} !important; }

        .sidebar-fixed {
          position: fixed;
          left: 0;
          top: 0;
          transition: width 0.2s ease, transform 0.2s ease;
        }
        .sidebar-fixed.collapsed { width: 76px !important; }
        .sidebar-fixed.collapsed .logo-text,
        .sidebar-fixed.collapsed .nav-label,
        .sidebar-fixed.collapsed .nav-chevron { display: none !important; }
        .sidebar-fixed.collapsed .navitem { justify-content: center; }
        .sidebar-fixed.collapsed .sub-menu { display: none !important; }

        @media (max-width: 900px) {
          .sidebar-fixed { width: 250px !important; transform: translateX(-100%); }
          .sidebar-fixed.collapsed { width: 250px !important; transform: translateX(0); }
          .sidebar-fixed.collapsed .logo-text,
          .sidebar-fixed.collapsed .nav-label,
          .sidebar-fixed.collapsed .nav-chevron { display: inline !important; }
          .sidebar-fixed.collapsed .navitem { justify-content: flex-start; }
          .sidebar-fixed.collapsed .sub-menu { display: flex !important; }
        }
        .sidebar-fixed.collapsed .sidebar-head { flex-direction: column; gap: 10px; align-items: center; }
        .sidebar-toggle-btn { margin-left: auto; flex-shrink: 0; }
        .sidebar-fixed.collapsed .sidebar-toggle-btn { margin-left: 0; }
      `}</style>

      <div className="sidebar-head" style={styles.sidebarHead}>
        <div style={styles.logoMark}>ED</div>
        <span className="logo-text" style={styles.logoText}>
          Eduboard
        </span>
        <button
          className="icon-btn sidebar-toggle-btn"
          style={styles.sidebarToggleBtn}
          onClick={onToggle}
          aria-label="Toggle sidebar"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeftClose
            size={17}
            style={{ transform: collapsed ? "scaleX(-1)" : "none" }}
          />
        </button>
      </div>

      <nav style={styles.nav}>
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item);
          const hasChildren = !!item.children;
          const isOpen = openMenu === item.key;
          return (
            <div key={item.key}>
              <Link
                to={item.href}
                className={`navitem${isActive ? " active" : ""}`}
                style={styles.navItem}
                onClick={(e) => {
                  if (hasChildren) {
                    e.preventDefault();
                    toggleMenu(item.key);
                  }
                }}
              >
                <Icon size={17} className="navicon" style={styles.navIcon} />
                <span className="nav-label" style={styles.navLabel}>
                  {item.label}
                </span>
                {hasChildren && (
                  <ChevronRight
                    size={14}
                    className="nav-chevron"
                    style={{
                      marginLeft: "auto",
                      transform: isOpen ? "rotate(90deg)" : "none",
                      transition: "transform 0.15s",
                      color: C.textFaint,
                    }}
                  />
                )}
              </Link>
              {hasChildren && isOpen && (
                <div className="sub-menu" style={styles.subMenu}>
                  {item.children.map((child) => {
                    const isChildActive = location.pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        to={child.href}
                        className={`subitem${isChildActive ? " active" : ""}`}
                        style={styles.subItem}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div style={styles.sidebarBottom}>
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.key}
              to={item.href}
              className={`navitem${isActive ? " active" : ""}`}
              style={styles.navItem}
            >
              <Icon size={17} className="navicon" style={styles.navIcon} />
              <span className="nav-label" style={styles.navLabel}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: 250,
    flexShrink: 0,
    background: C.sidebar,
    borderRight: `1px solid ${C.border}`,
    display: "flex",
    flexDirection: "column",
    padding: "18px 12px",
    height: "100vh",
    overflowY: "auto",
    overflowX: "hidden",
    zIndex: 50,
  },
  sidebarHead: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "4px 8px 20px",
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 9,
    background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    color: "#fff",
  },
  logoText: { fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" },
  sidebarToggleBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    background: C.cardAlt,
    border: `1px solid ${C.border}`,
    color: C.text,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  nav: { display: "flex", flexDirection: "column", gap: 2, flex: 1 },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    width: "100%",
    padding: "9px 10px",
    background: "none",
    border: "none",
    borderRadius: 9,
    color: C.textMuted,
    fontSize: 13.5,
    fontWeight: 500,
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.12s, color 0.12s",
  },
  navIcon: { color: "inherit", flexShrink: 0 },
  navLabel: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  subMenu: {
    display: "flex",
    flexDirection: "column",
    marginLeft: 38,
    marginTop: 2,
    marginBottom: 4,
    gap: 1,
  },
  subItem: {
    position: "relative",
    background: "none",
    border: "none",
    textAlign: "left",
    padding: "7px 10px 7px 14px",
    fontSize: 13,
    color: C.textFaint,
    cursor: "pointer",
    borderRadius: 7,
  },
  sidebarBottom: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    paddingTop: 10,
    borderTop: `1px solid ${C.border}`,
  },
};
