import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ThemeProvider, useOrgTheme } from "../context/ThemeContext";

function LayoutInner() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [collapsed, setCollapsed] = useState(false); // desktop: icon-only collapse
  const [mobileOpen, setMobileOpen] = useState(false); // mobile: drawer open/closed
  const { loading, error } = useOrgTheme() || {};

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((o) => !o);
    } else {
      setCollapsed((c) => !c);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f8fa",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <style>{`
          @keyframes lms-spin { to { transform: rotate(360deg); } }
        `}</style>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            border: "3px solid #e2e4e9",
            borderTopColor: "#1d4ed8",
            animation: "lms-spin 0.7s linear infinite",
          }}
        />
        <div style={{ color: "#6b7280", fontSize: 13.5, fontWeight: 500 }}>
          Loading your workspace...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f8fa",
        }}
      >
        <div
          style={{
            background: "#fff",
            border: "1px solid #fecaca",
            borderRadius: 14,
            padding: "24px 28px",
            maxWidth: 360,
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ color: "#dc2626", fontWeight: 600, fontSize: 14.5 }}>
            {error}
          </div>
          <div style={{ color: "#9ca3af", fontSize: 12.5, marginTop: 6 }}>
            Try refreshing the page. If this keeps happening, contact support.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f7f8fa" }}>
      <Sidebar
        collapsed={!isMobile && collapsed}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 40,
          }}
        />
      )}

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Topbar onToggleSidebar={handleToggleSidebar} />
        <main
          style={{
            padding: isMobile ? 14 : 24,
            flex: 1,
            boxSizing: "border-box",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function MainLayout() {
  return (
    <ThemeProvider>
      <LayoutInner />
    </ThemeProvider>
  );
}
