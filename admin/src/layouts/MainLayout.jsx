import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { C } from "../theme/colors";

function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div style={styles.root}>
      <style>{`
        * { box-sizing: border-box; }

        .overlay { animation: fadeIn 0.15s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        .main-area { transition: margin-left 0.2s ease; margin-left: 250px; }
        .main-area.collapsed { margin-left: 76px; }

        @media (max-width: 900px) {
          .main-area, .main-area.collapsed { margin-left: 0 !important; }
          .overlay.show { display: block !important; }
        }
      `}</style>

      <div
        className={`overlay${sidebarCollapsed ? " show" : ""}`}
        style={styles.overlay}
        onClick={() => setSidebarCollapsed(false)}
      />

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      <div
        className={`main-area${sidebarCollapsed ? " collapsed" : ""}`}
        style={styles.main}
      >
        <Header
          collapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
        />

        <main className="content-area" style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    // Sidebar/header dark backdrop still shows around the edges
    background: C.bg,
    color: C.text,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    position: "relative",
    overflowX: "hidden",
  },
  overlay: {
    display: "none",
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 40,
  },
  main: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    width: "100%",
    background: C.contentBg,
  },
  content: {
    padding: "24px 24px 24px",
    paddingTop: 96,
    display: "flex",
    flexDirection: "column",
    gap: 20,
    flex: 1,
    background: C.contentBg,
    color: C.contentText,
    minHeight: "100vh",
  },
};

export default MainLayout;
