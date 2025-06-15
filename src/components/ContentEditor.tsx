// D:\admin-frontend\src\components\ContentEditor.tsx
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import socket from "../socket";

interface Block {
  type: "text" | "image" | "video";
  value: string;
}

interface Content {
  _id?: string;
  title: string;
  blocks: Block[];
}

export default function ContentEditor() {
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [showPopup, setShowPopup] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBlocks, setNewBlocks] = useState<Block[]>([]);
  const [blockType, setBlockType] = useState<"text" | "image" | "video">("text");
  const [blockValue, setBlockValue] = useState("");
  const [blockFileUrl, setBlockFileUrl] = useState("");
  const [previewFile, setPreviewFile] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  console.log("Token:", localStorage.getItem("token"));
  useEffect(() => {
    fetch("http://localhost:3000/contents", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then(setContents);

    const socket = io("http://localhost:3000");
    socket.on("newContent", (newItem: Content) => {
    setContents((prev) => {
      const exists = prev.some(item => item._id === newItem._id);
      if (exists) return prev;
      return [newItem, ...prev];
    });
});

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (blockType === "image" && !["png", "jpg", "jpeg", "gif", "webp"].includes(ext || "")) {
      alert("File không phải là ảnh");
      return;
    }
    if (blockType === "video" && !["mp4", "webm", "ogg"].includes(ext || "")) {
      alert("File không phải là video");
      return;
    }

    setPreviewFile(URL.createObjectURL(file));
    setIsUploading(true); // Bắt đầu upload

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`http://localhost:3000/contents/upload?type=${blockType}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const data = await res.json();
      console.log("Upload response:", data);
      if (!data.url) {
        alert("Không nhận được URL sau khi upload.");
        setIsUploading(false);
        return;
      }
      setBlockFileUrl(data.url);
    } catch (err) {
      alert("Tải file thất bại");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddBlock = () => {
    // Kiểm tra loại block
    let value = "";

    if (blockType === "text") {
      if (!blockValue.trim()) {
        alert("Bạn chưa nhập nội dung cho block văn bản.");
        return;
      }
      value = blockValue.trim();
    } else {
      if (!blockFileUrl) {
        alert(`Bạn chưa upload file ${blockType}`);
        return;
      }
      value = blockFileUrl;
    }

    setNewBlocks([...newBlocks, { type: blockType, value }]);
    setBlockValue("");
    setBlockFileUrl("");
    setPreviewFile("");
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
    setBlockType("text");
  };



  const handleSubmit = async () => {
    if (!newTitle.trim() || newBlocks.length === 0) return alert("Điền đầy đủ tiêu đề và block");

    const newContent: Content = {
      title: newTitle,
      blocks: newBlocks,
    };

    try {
      const res = await fetch("http://localhost:3000/contents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newContent),
      });

      const saved = await res.json();

      socket.emit("submit-content", saved);

      alert("Đăng nội dung thành công");
      setShowPopup(false);
      setNewTitle("");
      setNewBlocks([]);
    } catch (err) {
      console.error("Submit failed", err);
      alert("Đăng nội dung thất bại");
    }
  };

  const handleDelete = async () => {
    if (!selectedContentId) return alert("Chọn nội dung cần xoá");
    await fetch(`http://localhost:3000/content/${selectedContentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setContents(contents.filter((c) => c._id !== selectedContentId));
    setSelectedContentId(null);
  };

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Quản lý nội dung</h1>

      <div className="flex flex-wrap gap-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setShowPopup(true)}>+ Thêm nội dung</button>
        <button className="px-4 py-2 bg-yellow-500 text-white rounded" disabled={!selectedContentId}>Sửa nội dung</button>
        <button className="px-4 py-2 bg-red-600 text-white rounded" disabled={!selectedContentId} onClick={handleDelete}>Xoá nội dung</button>
      </div>

      <input
        className="w-full p-3 border rounded shadow-sm"
        placeholder="Tìm kiếm tiêu đề nội dung..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="w-full text-left border rounded shadow">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2">Chọn</th>
            <th className="p-2">Tiêu đề</th>
            <th className="p-2">Số block</th>
          </tr>
        </thead>
        <tbody>
          {contents
            .filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
            .map((c) => (
              <tr key={c._id} className="hover:bg-gray-50">
                <td className="p-2">
                  <input
                    type="radio"
                    name="selectedContent"
                    checked={selectedContentId === c._id}
                    onChange={() => setSelectedContentId(c._id || null)}
                  />
                </td>
                <td className="p-2 font-medium">{c.title}</td>
                <td className="p-2">{c.blocks.length}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-green-500 p-6 rounded shadow-lg w-full max-w-2xl space-y-4">
            <h2 className="text-xl font-bold">Tạo nội dung mới</h2>
            <input className="w-full p-2 border rounded" placeholder="Tiêu đề" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <div className="flex items-center gap-2">
              <select
                className="p-2 border rounded"
                value={blockType}
                onChange={(e) => setBlockType(e.target.value as Block["type"])}
              >
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>

              {blockType !== "text" && (
                <>
                  <input
                    type="file"
                    accept={blockType === "image" ? "image/*" : "video/*"}
                    onChange={handleUpload}
                  />
                  <button
                    className="text-sm text-red-500 underline"
                    onClick={() => {
                      setBlockFileUrl("");
                      setPreviewFile("");
                      (document.querySelector('input[type="file"]') as HTMLInputElement).value = "";
                    }}>
                    Xoá file đã chọn
                  </button>
                </>
              )}
            </div>

            {blockType === "text" && (
              <input
                className="w-full p-2 border rounded"
                placeholder="Nhập nội dung text"
                value={blockValue}
                onChange={(e) => setBlockValue(e.target.value)}
              />
            )}

            {(previewFile || blockFileUrl) && (
              <div className="border rounded p-2">
                {blockType === "image" && (
                  <img src={blockFileUrl || previewFile} alt="preview" className="max-h-[300px]" />
                )}
                {blockType === "video" && (
                  <video controls className="max-h-[300px] w-full">
                    <source src={blockFileUrl || previewFile} />
                  </video>
                )}
              </div>
            )}

            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleAddBlock} disabled={isUploading}>+ Thêm block</button>

            <div className="space-y-2">
              {newBlocks.map((b, idx) => (
                <div key={idx} className="border p-2 rounded bg-gray-50">
                  <strong>{b.type}</strong>: {b.value}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button className="px-6 py-2 bg-green-600 text-white rounded" onClick={handleSubmit}>Submit</button>
              <button className="px-6 py-2 bg-gray-400 text-white rounded" onClick={() => setShowPopup(false)}>Huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
