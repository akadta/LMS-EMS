import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import api from "../api/Axios";

function CentralProtectedRoutes() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const token = localStorage.getItem("central_token");
    if (!token) {
      setStatus("invalid");
      return;
    }

    api
      .get("/central/login/validate")
      .then(() => setStatus("valid"))
      .catch(() => {
        localStorage.removeItem("central_token");
        localStorage.removeItem("central_user");
        setStatus("invalid");
      });
  }, []);

  if (status === "checking") return null;
  if (status === "invalid") return <Navigate to="/" replace />;

  return <Outlet />;
}

export default CentralProtectedRoutes;
