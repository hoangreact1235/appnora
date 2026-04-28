import React, { useState } from "react";

export default function CreateUserPopup({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onCreated();
        onClose();
      } else {
        setError(data.error || "Tạo tài khoản thất bại");
      }
    } catch (err) {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(255,255,255,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative bg-white rounded-2xl shadow p-8 w-[380px]">
        <button className="absolute top-2 right-2 text-xl text-gray-500 hover:text-pink-600" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold text-pink-600 mb-4">Tạo tài khoản nhân viên</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="border border-pink-200 rounded px-3 py-2 text-[#D81B60] font-semibold placeholder:text-pink-400 placeholder:font-semibold focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <input
            className="border border-pink-200 rounded px-3 py-2 text-[#D81B60] font-semibold placeholder:text-pink-400 placeholder:font-semibold focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
            placeholder="Mật khẩu"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <input
            className="border border-pink-200 rounded px-3 py-2 text-[#D81B60] font-semibold placeholder:text-pink-400 placeholder:font-semibold focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none"
            placeholder="Tên hiển thị"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            required
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded px-4 py-2 mt-2" disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo tài khoản"}
          </button>
        </form>
      </div>
    </div>
  );
}
