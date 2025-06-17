// src/components/ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

type Props = {
  allowedRoles: string[];
  children: React.ReactNode;
};

export default function ProtectedRoute({ allowedRoles, children }: Props) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    const fetchRole = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("http://localhost:3000/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setRole(res.data.role);
      } catch (err) {
        console.error("Không thể lấy role từ token", err);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [token]);

  if (!token) return <Navigate to="/login" />;

  if (loading) return <div className="p-4 text-center">Đang kiểm tra quyền truy cập...</div>;

  if (!role || !allowedRoles.includes(role)) {
    return (
      <div className="p-4 text-center text-red-600 font-semibold">
        Bạn không có quyền truy cập trang này.<br />
        Vui lòng liên hệ quản trị viên để được cấp quyền.
      </div>
    );
  }

  return <>{children}</>;
}
