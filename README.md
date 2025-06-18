# Admin Frontend

Giao diện quản trị nội dung và người dùng dành cho hệ thống full-stack.

## 🧰 Công nghệ sử dụng

- **React** + **TypeScript**
- **Vite** (bundler)
- **Tailwind CSS** (UI)
- **React Router** (định tuyến)
- **WebSocket** (realtime push nội dung)
- **Azure Blob Storage** (upload ảnh/video)

## 🚀 Chức năng chính

- **Đăng nhập** và xác thực qua JWT
- **Phân quyền giao diện theo vai trò người dùng**
  - `admin`: quản lý người dùng + nội dung
  - `editor`: chỉ quản lý nội dung
- **Quản lý người dùng** (tạo / sửa / xoá / tìm kiếm)
- **Quản lý nội dung**:
  - Tạo bài viết gồm nhiều block (text / ảnh / video)
  - Upload và xoá file trên **Azure Blob Storage**
  - Xem trước ảnh/video khi chỉnh sửa
- **Realtime cập nhật nội dung**: đẩy dữ liệu ngay đến client thông qua WebSocket

## ⚙️ Cài đặt và chạy local

```bash
# 1. Cài dependencies
npm install

# 2. Khởi chạy dev server
npm run dev

Ứng dụng chạy ở địa chỉ: http://localhost:5174

📌 Lưu ý: Đảm bảo backend đã chạy trước khi khởi động admin site.
Thứ tự khởi chạy đề xuất: backend → client-frontend → admin-frontend

📁 Cấu trúc project cơ bản
admin-frontend/
├── public/
├── src/
│   ├── components/       # Các thành phần UI tái sử dụng
│   ├── pages/            # Trang chính (login, dashboard, quản lý user/content)
│   └── main.tsx          # Entry point
├── vite.config.ts
└── package.json

📦 Phụ thuộc chính
- axios
- react-router-dom
- socket.io-client
- classnames
- tailwindcss, postcss, autoprefixer

📬 Liên hệ
Tác giả: Hoàng Trịnh Anh Khoa
Email: khoahoangtrinhanh@gmail.com
link Github: https://github.com/KhoaHoangTrinhAnh


