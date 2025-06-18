// D:\admin-frontend\src\components\UserManagement.tsx
import { useCallback, useEffect, useState } from "react";
import socket from "../socket";

interface User {
  _id?: string;
  email: string;
  name: string;
  password?: string;
  role: "admin" | "editor" | "client";
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState<User>({ email: "", name: "", password: "", role: "client" });
  const [editUser, setEditUser] = useState<User | null>(null);
  const [search, setSearch] = useState("");
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);

  const token = localStorage.getItem("access_token");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3000/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
      } else {
        console.error("Lỗi lấy danh sách người dùng:", data.message);
      }
    } catch (error) {
      console.error("Fetch users failed:", error);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchUsers();
    socket.on("usersUpdated", fetchUsers);
    return () => {
    socket.off("usersUpdated", fetchUsers);
  };

  }, [token, fetchUsers]);

  const handleSubmitAdd = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      alert("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    // Check định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      alert("Email không hợp lệ.");
      return;
    }

    // Check trùng email trong danh sách đã fetch
    if (users.some((u) => u.email === newUser.email)) {
      alert("Email đã tồn tại.");
      return;
    }

    // Check độ dài tên
    if (newUser.name.length < 2 || newUser.name.length > 50) {
      alert("Tên phải từ 2 đến 50 ký tự.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const saved = await res.json();
      if (!res.ok) throw new Error(saved.message || "Lỗi khi tạo user");

      setUsers(prev => [saved, ...prev]);
      alert("Tạo user thành công");
      await fetchUsers();  // cập nhật lại danh sách người dùng
      setShowAddPopup(false);
      setNewUser({ email: "", name: "", password: "", role: "client" });
      } catch (err) {
        console.error("Đăng ký user thất bại:", err);
        alert("Tạo user thất bại");
      }

  };

  const handleDelete = async () => {
    if (!selectedUserId) {
      alert("Vui lòng chọn user để xoá");
      return;
    }

    try {
      await fetch(`http://localhost:3000/users/${selectedUserId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(prev => prev.filter(u => u._id !== selectedUserId));
      setSelectedUserId(null);
      await fetchUsers();  // cập nhật lại danh sách người dùng
      alert("Xoá user thành công");
} catch (err) {
  console.error("Xoá user thất bại:", err);
  alert("Xoá user thất bại");
}

  };

//--------------------------Xử lý sửa nội dung--------------------------
  const handleEditClick = () => {
      const user = users.find((u) => u._id === selectedUserId);
      if (!user) return alert("Không tìm thấy user");

      setEditUser(user);
      setShowEditPopup(true);
    };

  const handleSubmitEdit = async () => {
    if (!editUser || !editUser._id) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editUser.email)) {
      alert("Email không hợp lệ.");
      return;
    }

    if (
      users.some(
        (u) => u.email === editUser.email && u._id !== editUser._id
      )
    ) {
      alert("Email đã tồn tại.");
      return;
    }

    if (editUser.name.length < 2 || editUser.name.length > 50) {
      alert("Tên phải từ 2 đến 50 ký tự.");
      return;
    }

      const token = localStorage.getItem("access_token");
      const updatedData: Partial<Pick<User, "email" | "name" | "role" | "password">> = {
        email: editUser.email,
        name: editUser.name,
        role: editUser.role,
      };

      if (editUser.password?.trim()) {
        updatedData.password = editUser.password;
      }

      try {
        const res = await fetch(`http://localhost:3000/users/${editUser._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        });

        if (res.ok) {
          setShowEditPopup(false);
          setEditUser(null);
          socket.emit("usersUpdated"); // nếu cần chủ động
        } else {
          const data = await res.json();
          alert("Cập nhật thất bại: " + data.message);
        }
      } catch (err) {
        console.error("Cập nhật user thất bại:", err);
        alert("Cập nhật user thất bại");
      }

    };

  return (
    <div className="pt-20 h-screen p-6 max-w-screen-xl mx-auto space-y-6">
      <div className="flex flex-col items-center space-y-4">
      <h1 className="text-3xl font-bold">Quản lý người dùng</h1>

      <div className="flex gap-3">
        <button className="bg-blue-600 px-4 py-2 text-white rounded" onClick={() => setShowAddPopup(true)}>Thêm user</button>
        <button className="bg-yellow-500 px-4 py-2 text-white rounded" onClick={handleEditClick}>Sửa user</button>
        <button className="bg-red-600 px-4 py-2 text-white rounded" onClick={handleDelete}>Xoá user</button>
      </div>
      </div>

      <input
        className="w-full p-3 border rounded"
        placeholder="Tìm kiếm theo email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="w-full border mt-4">
        <thead className="bg-gray-200 text-black">
          <tr>
            <th className="p-2">Chọn</th>
            <th className="p-2">Email</th>
            <th className="p-2">Họ tên</th>
            <th className="p-2">Quyền</th>
          </tr>
        </thead>
        <tbody>
          {users.filter(u => u.email.includes(search)).map((u) => (
            <tr key={u._id} className="border-t">
              <td className="p-2">
                <input type="radio" checked={selectedUserId === u._id} onChange={() => setSelectedUserId(u._id || null)} />
              </td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.name}</td>
              <td className="p-2 capitalize">{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showAddPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4">
            <h2 className="text-xl text-black font-bold">Thêm user mới</h2>
            <input className="w-full p-2 border rounded" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            <input className="w-full p-2 border rounded" placeholder="Tên" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            <input className="w-full p-2 border rounded" placeholder="Mật khẩu" type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
            <select className="w-full p-2 border rounded" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value as User["role"] })}>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="client">Client</option>
            </select>
            <div className="flex gap-3">
              <button className="bg-green-600 px-4 py-2 text-white rounded" onClick={handleSubmitAdd}>Tạo</button>
              <button className="bg-gray-400 px-4 py-2 text-white rounded" onClick={() => setShowAddPopup(false)}>Huỷ</button>
            </div>
          </div>
        </div>
      )}

      {showEditPopup && editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4">
            <h2 className="text-xl text-black font-bold">Chỉnh sửa user</h2>
            <input className="w-full p-2 border rounded" placeholder="Email" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} />
            <input className="w-full p-2 border rounded" placeholder="Tên" value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} />
            <input type="text" className="w-full p-2 border rounded" placeholder="Mật khẩu mới (để trống nếu không đổi)" value={editUser.password || ""} onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}/>
            <select className="w-full p-2 border rounded" value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value as User["role"] })}>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="client">Client</option>
            </select>
            <div className="flex gap-3">
              <button className="bg-blue-600 px-4 py-2 text-white rounded" onClick={handleSubmitEdit}>Lưu</button>
              <button className="bg-gray-400 px-4 py-2 text-white rounded" onClick={() => setShowEditPopup(false)}>Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
