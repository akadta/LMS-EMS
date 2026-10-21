import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import api from "../api/Axios";
function UserProtectedRoutes() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const token = localStorage.getItem("user_token");
    if (!token) {
      setStatus("invalid");
      return;
    }

    api
      .get("/user/login/validate")
      .then(() => setStatus("valid"))
      .catch(() => {
        localStorage.removeItem("user_token");
        localStorage.removeItem("user_user");
        setStatus("invalid");
      });
  }, []);

  if (status === "checking") return null;
  if (status === "invalid") return <Navigate to="/" replace />;

  return <Outlet />;
}

export default UserProtectedRoutes;
