import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/Axios";

const ThemeContext = createContext(null);

function hexToRgb(hex) {
  if (!hex) return "0, 0, 0";
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
}

export function ThemeProvider({ children }) {
  const [orgContext, setOrgContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/user/context")
      .then((res) => {
        const data = res.data.data;
        setOrgContext(data);

        const root = document.documentElement;
        root.style.setProperty("--accent", data.themeColor || "#1d4ed8");
        root.style.setProperty("--accent-rgb", hexToRgb(data.themeColor));
        root.style.setProperty("--sidebar-bg", data.sidebarColor || "#0e1220");
        root.style.setProperty("--header-bg", data.headerColor || "#0a0d16");
      })
      .catch(() => setError("Failed to load organization theme."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ThemeContext.Provider value={{ orgContext, loading, error }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useOrgTheme() {
  return useContext(ThemeContext);
}
