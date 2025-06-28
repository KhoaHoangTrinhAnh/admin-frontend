// D:\admin-frontend\src\pages\AdminLogin.tsx
import { useState } from "react";
import axios from 'axios';

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const API_URL = import.meta.env.VITE_API_URL;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const accessToken = loginRes.data.access_token;
      if (!accessToken) throw new Error("Không nhận được token!");

      localStorage.setItem("access_token", accessToken);

      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${accessToken}`;

      console.log("Access token:", accessToken);

      const meRes = await axios.get(`${API_URL}/auth/me`);
      const role = meRes.data?.role;

      localStorage.setItem("role", role);

      if (role === "admin") {
        window.location.href = "/";
      } else if (role === "editor") {
        window.location.href = "/";
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message || err.message || "Đăng nhập thất bại");
      } else if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Đăng nhập thất bại");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white text-black p-8 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Đăng nhập Admin</h2>

        <input
          type="email"
          placeholder="Email"
          className="w-full border px-4 py-2 rounded text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Mật khẩu"
          className="w-full border px-4 py-2 rounded text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Đăng nhập
        </button>
      </form>
    </div>
  );
}
