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
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBlocks, setNewBlocks] = useState<Block[]>([]);
  const [blockType, setBlockType] = useState<Block["type"]>("text");
  const [blockValue, setBlockValue] = useState("");
  const [blockFileUrl, setBlockFileUrl] = useState("");
  const [previewFile, setPreviewFile] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBlocks, setEditBlocks] = useState<Block[]>([]);
  const [editBlockType, setEditBlockType] = useState<Block['type']>("text");

  const [pendingBlockValue, setPendingBlockValue] = useState(""); // text hoặc URL file
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);


  useEffect(() => {
    fetch("http://localhost:3000/contents", { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}`, }})
      .then((res) => res.json()).then(setContents);

    socket.on("newContent", (item: Content) => {
      setContents(prev => prev.some(c => c._id === item._id) ? prev : [item, ...prev]);
    });
    socket.on("deleteContent", ({ id }: { id: string }) => {
      setContents(prev => prev.filter(c => c._id !== id));
    });
    socket.on("updateContent", (updated: Content) => {
      setContents(prev => prev.map(c => c._id === updated._id ? updated : c));
    });
    return () => {
      socket.off("newContent");
      socket.off("deleteContent");
      socket.off("updateContent");
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

  const handleSubmitAdd = async () => {
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
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(newContent),
      });

      const saved = await res.json();
      if (!res.ok) throw new Error(saved.message || 'Lỗi khi lưu nội dung');

      socket.emit("submit-content", saved);

      alert("Đăng nội dung thành công");
      setShowAddPopup(false);
      setNewTitle("");
      setNewBlocks([]);
    } catch (err) {
      console.error("Submit failed", err);
      alert("Đăng nội dung thất bại");
    }
  };
// 
  const handleDelete = async () => {
    if (!selectedContentId) {
    alert("Hãy chọn ít nhất 1 nội dung để xoá");
    return;
    }
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
  if (!selectedContentId) {
    alert("Không tìm thấy nội dung để xoá.");
    setShowDeleteConfirm(false);
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/contents/${selectedContentId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });

    if (!res.ok) {
      throw new Error("Server trả về lỗi");
    }

    setContents((prev) => prev.filter((c) => c._id !== selectedContentId));
    setSelectedContentId(null);
  } catch (error) {
    console.error("Xoá thất bại:", error);
    alert("Xoá thất bại.");
  } finally {
    setShowDeleteConfirm(false);
  }
};
//--------------------------Xử lý sửa nội dung--------------------------
const handlePendingFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setIsUploadingEdit(true);
  try {
    const formData = new FormData();
    formData.append("file", file);
    const type = editBlockType; // 'image' hoặc 'video'

    const res = await fetch(`http://localhost:3000/contents/upload?type=${type}`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setPendingBlockValue(data.url);
  } catch (err) {
  console.error("Upload failed", err);
  } finally {
    setIsUploadingEdit(false);
  }

  // Giả lập upload
  const url = URL.createObjectURL(file);
  setPendingBlockValue(url);
  setIsUploadingEdit(false);
};

const handleAddEditBlock = () => {
  if (!pendingBlockValue.trim()) return alert("Vui lòng nhập nội dung hoặc chọn file");

  setEditBlocks((prev) => [...prev, { type: editBlockType, value: pendingBlockValue }]);
  setPendingBlockValue("");
};


const handleEditClick = () => {
  if (!selectedContentId) return alert("Hãy chọn một nội dung để sửa");

  const content = contents.find((c) => c._id === selectedContentId);
  if (!content) return alert("Không tìm thấy nội dung");

  setEditTitle(content.title);
  setEditBlocks(content.blocks);
  setShowEditPopup(true);
};

const handleEditBlockChange = (index: number, value: string) => {
  setEditBlocks((prev) => {
    const updated = [...prev];
    updated[index].value = value;
    return updated;
  });
};

const handleDeleteEditBlock = (index: number) => {
  setEditBlocks((prev) => prev.filter((_, i) => i !== index));
};

const handleSubmitEdit = async () => {
  if (!selectedContentId || !editTitle.trim() || editBlocks.length === 0) {
    alert("Điền đầy đủ tiêu đề và block");
    return;
  }

  const updatedContent: Content = {
    title: editTitle,
    blocks: editBlocks,
  };

  try {
    const res = await fetch(`http://localhost:3000/contents/${selectedContentId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: JSON.stringify(updatedContent),
    });

    if (!res.ok) throw new Error("Update failed");

    const updated = await res.json();

    setContents((prev) =>
      prev.map((item) => (item._id === selectedContentId ? updated : item))
    );

    setShowEditPopup(false);
    setEditTitle("");
    setEditBlocks([]);
    setSelectedContentId(null);

    alert("Cập nhật thành công");
  } catch (err) {
    console.error("Cập nhật thất bại:", err);
    alert("Cập nhật thất bại");
  }
};


  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Quản lý nội dung</h1>

      <div className="flex flex-wrap gap-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setShowAddPopup(true)}>Thêm nội dung</button>
        <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleDelete}>Xoá nội dung</button>
        <button className="px-4 py-2 bg-yellow-500 text-white rounded" onClick={handleEditClick}>Sửa nội dung</button>

      </div>

      <input
        className="w-full p-3 border rounded shadow-sm"
        placeholder="Tìm kiếm tiêu đề nội dung..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="w-full text-left border rounded shadow">
        <thead className="bg-gray-200 text-black">
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

      {showAddPopup && (
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

            <button
              className={`px-4 py-2 bg-blue-600 text-white rounded ${isUploading ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
              onClick={handleAddBlock}
              disabled={isUploading}>
              Thêm block
            </button>

            <div className="space-y-2">
              {newBlocks.map((b, idx) => (
                <div key={idx} className="border p-2 rounded bg-gray-50 text-black">
                  <strong>{b.type}</strong>: {b.value}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button className="px-6 py-2 bg-green-600 text-white rounded" onClick={handleSubmitAdd}>Submit</button>
              <button className="px-6 py-2 bg-gray-400 text-white rounded" onClick={() => setShowAddPopup(false)}>Huỷ</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-4">
            <h2 className="text-xl font-bold text-red-600">Xác nhận xoá</h2>
            <p>Bạn có chắc chắn muốn xoá nội dung này không?</p>
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-400 text-white rounded" onClick={() => setShowDeleteConfirm(false)}>Huỷ</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleConfirmDelete}>Xoá</button>
            </div>
          </div>
        </div>
      )}

      {showEditPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-2xl space-y-4">
            <h2 className="text-xl font-bold text-black">Chỉnh sửa nội dung</h2>

            <input
              className="w-full p-2 border rounded"
              placeholder="Tiêu đề"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />

            {editBlocks.map((block, index) => (
              <div key={index} className="border p-3 rounded bg-gray-100 space-y-2 relative">
                <div className="text-sm font-semibold capitalize">{block.type}</div>

                {block.type === 'text' ? (
                  <input
                    className="w-full p-2 border rounded"
                    value={block.value}
                    onChange={(e) => handleEditBlockChange(index, e.target.value)}
                    placeholder="Nội dung text"
                  />
                ) : (
                  <>
                    {block.type === 'image' ? (
                      <img src={block.value} alt="preview" className="max-h-[200px] rounded" />
                    ) : (
                      <video controls className="max-h-[200px] w-full">
                        <source src={block.value} />
                      </video>
                    )}
                  </>
                )}

                <button
                  className="text-red-600 text-sm underline absolute top-2 right-2"
                  onClick={() => handleDeleteEditBlock(index)}
                >
                  Xoá block
                </button>
              </div>
            ))}

            <div className="space-y-2 border-t pt-4">
              <div className="flex gap-2 items-center">
                <select
                  className="p-2 border rounded"
                  value={editBlockType}
                  onChange={(e) => {
                    setEditBlockType(e.target.value as Block['type']);
                    setPendingBlockValue("");
                  }}
                >
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>

                {editBlockType === 'text' ? (
                  <input
                    className="flex-1 p-2 border rounded"
                    placeholder="Nhập nội dung text"
                    value={pendingBlockValue}
                    onChange={(e) => setPendingBlockValue(e.target.value)}
                  />
                ) : (
                  <input
                    type="file"
                    accept={editBlockType === 'image' ? 'image/*' : 'video/*'}
                    onChange={handlePendingFileChange}
                  />
                )}

                <button
                  className={`px-4 py-2 bg-blue-600 text-white rounded ${isUploadingEdit ? 'cursor-wait opacity-70' : 'cursor-pointer'}`}
                  onClick={handleAddEditBlock}
                  disabled={isUploadingEdit || !pendingBlockValue.trim()}>
                  Thêm block
                </button>
              </div>
              {/* Bổ sung phần preview */}
              {pendingBlockValue && editBlockType !== 'text' && (
                <div className="mt-2">
                  {editBlockType === 'image' ? (
                    <img src={pendingBlockValue} alt="preview" className="max-h-[200px] rounded" />
                  ) : (
                    <video controls className="max-h-[200px] w-full">
                      <source src={pendingBlockValue} />
                    </video>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                className="px-5 py-2 bg-gray-400 text-white rounded"
                onClick={() => setShowEditPopup(false)}
              >
                Huỷ
              </button>
              <button
                className="px-5 py-2 bg-green-600 text-white rounded"
                onClick={handleSubmitEdit}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
