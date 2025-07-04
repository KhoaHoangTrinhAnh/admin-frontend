// D:\admin-frontend\src\App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

import ContentEditor from "./components/ContentEditor";
import AdminLogin from "./pages/AdminLogin";
import UserManagement from "./components/UserManagement";
import ProtectedRoute from "./components/ProtectedRoute";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access_token");

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("role");
    setRole(null);
    window.location.href = "/login";
  };

  useEffect(() => {
    const fetchRole = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setRole(res.data.role);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [token]);

  if (loading) {
    return <div className="p-4 text-center">Đang tải thông tin người dùng...</div>;
  }

  return (
    <Router>
      <div className="w-screen">
      <div>
        {token && role && (
          <header className="mx-auto" style={{position: "fixed", top: 0, left: 0, right: 0, padding: "10px", background: "#eee", display: "flex", gap: "20px", justifyContent: "center", alignItems: "center", zIndex: 50}}>
            {role === "admin" && <Link to="/users">Quản lý người dùng</Link>}
            {(role === "admin" || role === "editor") && <Link to="/contents">Quản lý nội dung</Link>}
            <button onClick={handleLogout}>Đăng xuất</button>
          </header>
        )}

        <main style={{ padding: "20px" }}>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route
              path="/"
              element={
                token ? (
                  <Navigate to={role === "admin" ? "/users" : "/contents"} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contents"
              element={
                <ProtectedRoute allowedRoles={["admin", "editor"]}>
                  <ContentEditor />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div></div>
    </Router>
  );
}

export default App;
