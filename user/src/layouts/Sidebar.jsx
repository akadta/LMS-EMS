import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  GraduationCap,
  UserCog,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  Network,
  X,
  Users,
  History
} from "lucide-react";
import { useOrgTheme } from "../context/ThemeContext";
import { resolveImageUrl } from "../utils/resolveImageUrl";

/**
 * `modules` controls LMS/EMS visibility.
 *  - omitted / undefined  -> always shown (module-agnostic, e.g. Dashboard)
 *  - ["lms"]              -> shown only when orgContext.isLms is true
 *  - ["ems"]              -> shown only when orgContext.isEms is true
 *  - ["lms", "ems"]       -> shown when EITHER is true
 *
 * Adjust these tags per item to match how you want LMS vs EMS to behave.
 */
const MENU = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    roles: ["organization", "company", "department"],
  },
  {
    label: "Courses",
    icon: BookOpen,
    roles: ["organization", "company", "department"],
    modules: ["lms"],
    children: [
      {
        label: "All Courses",
        path: "/courses",
        roles: ["organization", "company", "department"],
        modules: ["lms"],
      },
    ],
  },
  {
    label: "Students",
    icon: GraduationCap,
    path: "/students",
    roles: ["organization", "company", "department"],
    modules: ["lms"],
  },
  {
    label: "Faculty",
    icon: UserCog,
    path: "/faculty",
    roles: ["organization", "company", "department"],
    modules: ["lms"],
  },
  {
    label: "Companies",
    icon: Building2,
    path: "/companies",
    roles: ["organization"],
  },
  {
    label: "Departments",
    icon: Network,
    path: "/departments",
    roles: ["company"],
  },
  {
    label: "Batches",
    icon: Users,
    path: "/batches",
    roles: ["organization", "company", "department"],
    modules: ["lms"],
  },
  {
    label: "Your Courses",
    icon: BookOpen,
    path: "/student/batches",
    roles: ["student"],
    modules: ["lms"],
  },
  {
    label: "My History",
    icon: History,
    path: "/student/history",
    roles: ["student"],
    modules: ["lms"],
  },
  {
    label: "My Batches",
    icon: Users,
    path: "/faculty/batches",
    roles: ["faculty"],
    modules: ["lms"],
  },
  {
    label: "Review Queue",
    icon: FileCheck2,
    path: "/faculty/review-queue",
    roles: ["faculty"],
    modules: ["lms"],
  },
];

function isModuleAllowed(itemModules, orgContext) {
  // No modules tag -> always allowed
  if (!itemModules || itemModules.length === 0) return true;
  if (!orgContext) return false;

  return itemModules.some((m) => {
    if (m === "lms") return !!orgContext.isLms;
    if (m === "ems") return !!orgContext.isEms;
    return false;
  });
}

function filterMenuByRoleAndModules(menu, role, orgContext) {
  if (!role) return [];

  return menu
    .filter((item) => item.roles?.includes(role))
    .filter((item) => isModuleAllowed(item.modules, orgContext))
    .map((item) => {
      if (!item.children) return item;

      const children = item.children
        .filter((child) => child.roles?.includes(role))
        .filter((child) => isModuleAllowed(child.modules, orgContext));

      return children.length ? { ...item, children } : null;
    })
    .filter(Boolean);
}

const SIDEBAR_STYLES = `
.lms-sidebar-header { display:flex; align-items:center; padding:16px 14px; gap:10px; }
.lms-sidebar-logo { width:34px; height:34px; border-radius:9px; object-fit:cover; box-shadow:0 2px 8px rgba(0,0,0,0.35); flex-shrink:0; }
.lms-sidebar-orgname { color:#fff; font-weight:700; font-size:13.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.lms-sidebar-caption { color:rgba(255,255,255,0.35); font-size:10px; font-weight:600; letter-spacing:0.07em; text-transform:uppercase; margin-top:2px; }
.lms-sidebar-divider { height:1px; background:rgba(255,255,255,0.08); margin:0 16px 12px; }
.lms-sidebar-eyebrow { padding:0 18px 8px; font-size:10.5px; font-weight:600; letter-spacing:0.09em; color:rgba(255,255,255,0.3); text-transform:uppercase; }
.lms-nav-item { position:relative; display:flex; align-items:center; gap:11px; width:100%; padding:9px 12px; border-radius:10px; border:none; background:transparent; color:rgba(255,255,255,0.62); font-size:13.5px; font-weight:500; text-decoration:none; cursor:pointer; box-sizing:border-box; transition:background .15s ease,color .15s ease; }
.lms-nav-item:hover { background:rgba(255,255,255,0.06); color:#fff; }
.lms-nav-item.active { background:linear-gradient(135deg, rgba(var(--accent-rgb),0.26), rgba(var(--accent-rgb),0.08)); color:#fff; font-weight:600; box-shadow:inset 2.5px 0 0 var(--accent); }
.lms-nav-icon { display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.lms-close-btn { display:flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:8px; border:none; background:transparent; color:rgba(255,255,255,0.6); cursor:pointer; transition:background .15s ease,color .15s ease; flex-shrink:0; }
.lms-close-btn:hover { background:rgba(255,255,255,0.08); color:#fff; }
.lms-submenu { position:relative; padding-left:18px; margin:2px 0 4px; }
.lms-submenu::before { content:""; position:absolute; left:29px; top:0; bottom:8px; width:1px; background:rgba(255,255,255,0.08); }
.lms-submenu-item { display:block; padding:7px 10px 7px 20px; margin:1px 0; border-radius:8px; font-size:12.5px; color:rgba(255,255,255,0.52); font-weight:400; text-decoration:none; transition:background .15s ease,color .15s ease; }
.lms-submenu-item:hover { background:rgba(255,255,255,0.05); color:#fff; }
.lms-submenu-item.active { background:rgba(var(--accent-rgb),0.16); color:#fff; font-weight:600; }
.lms-sidebar-scroll::-webkit-scrollbar { width:6px; }
.lms-sidebar-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:10px; }
.lms-sidebar-scroll::-webkit-scrollbar-track { background:transparent; }
`;

export default function Sidebar({ collapsed, isMobile, mobileOpen, onClose }) {
  const [openMenus, setOpenMenus] = useState({});
  const { orgContext } = useOrgTheme() || {};

  const menuItems = filterMenuByRoleAndModules(
    MENU,
    orgContext?.role,
    orgContext
  );

  const toggleMenu = (label) =>
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));

  const width = isMobile ? 250 : collapsed ? 72 : 250;

  const baseStyle = isMobile
    ? {
        position: "fixed",
        top: 0,
        left: mobileOpen ? 0 : -270,
        height: "100vh",
        zIndex: 50,
        transition: "left 0.2s ease",
        boxShadow: mobileOpen ? "2px 0 24px rgba(0,0,0,0.35)" : "none",
      }
    : {
        position: "sticky",
        top: 0,
        height: "100vh",
        transition: "width 0.18s ease",
        flexShrink: 0,
      };

  return (
    <aside
      style={{
        width,
        background: "var(--sidebar-bg)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        ...baseStyle,
      }}
      className="lms-sidebar-scroll"
    >
      <style>{SIDEBAR_STYLES}</style>

      <div
        className="lms-sidebar-header"
        style={{ justifyContent: collapsed ? "center" : "space-between" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
        >
          {orgContext?.logoUrl ? (
            <img
              src={resolveImageUrl(orgContext.logoUrl)}
              alt="logo"
              className="lms-sidebar-logo"
            />
          ) : (
            <div
              className="lms-sidebar-logo"
              style={{ background: "var(--accent)" }}
            />
          )}
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div className="lms-sidebar-orgname">
                {orgContext?.organizationName || "Organization"}
              </div>
              <div className="lms-sidebar-caption">Admin Console</div>
            </div>
          )}
        </div>

        {isMobile && (
          <button type="button" onClick={onClose} className="lms-close-btn">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="lms-sidebar-divider" />

      <nav style={{ padding: "4px 8px 12px", flex: 1 }}>
        {!collapsed && <div className="lms-sidebar-eyebrow">Main Menu</div>}

        {menuItems.map((item) => (
          <div key={item.label} style={{ marginBottom: 2 }}>
            {item.children ? (
              <>
                <button
                  type="button"
                  onClick={() => toggleMenu(item.label)}
                  className="lms-nav-item"
                >
                  <span className="lms-nav-icon">
                    <item.icon size={17} />
                  </span>
                  {!collapsed && (
                    <>
                      <span style={{ flex: 1, textAlign: "left" }}>
                        {item.label}
                      </span>
                      {openMenus[item.label] ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </>
                  )}
                </button>
                {!collapsed && openMenus[item.label] && (
                  <div className="lms-submenu">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={isMobile ? onClose : undefined}
                        className={({ isActive }) =>
                          "lms-submenu-item" + (isActive ? " active" : "")
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <NavLink
                to={item.path}
                onClick={isMobile ? onClose : undefined}
                className={({ isActive }) =>
                  "lms-nav-item" + (isActive ? " active" : "")
                }
              >
                <span className="lms-nav-icon">
                  <item.icon size={17} />
                </span>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}