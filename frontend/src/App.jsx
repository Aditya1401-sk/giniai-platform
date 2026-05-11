import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import ManagementDashboard from "./pages/ManagementDashboard";
import SalesDashboard from "./pages/SalesDashboard";
import DeveloperDashboard from "./pages/DeveloperDashboard";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "./config";

function App() {
  const email = sessionStorage.getItem("email");

  useEffect(() => {
    if (!email) return;

    const pulse = () => {
      const currentEmail = sessionStorage.getItem("email");
      if (!currentEmail) return;
      axios.post(`${API_BASE_URL}/auth/pulse`, { email: currentEmail }).catch(() => {});
    };

    pulse(); // Initial pulse
    const interval = setInterval(pulse, 30000); // Pulse every 30 seconds
    return () => clearInterval(interval);
  }, [email]);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          {/* LOGIN PAGE */}
          <Route path="/" element={<Login />} />

          {/* ADMIN */}
          <Route
            path="/admin"
            element={
              role === "admin" ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* MANAGEMENT */}
          <Route
            path="/management"
            element={
              role === "management" ? (
                <ManagementDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* SALES */}
          <Route
            path="/sales"
            element={
              role === "sales" ? (
                <SalesDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* DEVELOPER */}
          <Route
            path="/developer"
            element={
              role === "developer" ? (
                <DeveloperDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;