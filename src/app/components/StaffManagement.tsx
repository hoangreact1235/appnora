"use client";
import React, { useEffect, useState } from "react";

interface Staff {
  username: string;
  displayName: string;
  role: string;
}

export default function StaffManagement({ onClose }: { onClose: () => void }) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetResult, setResetResult] = useState<{ username: string; newPassword: string } | null>(null);

  async function fetchStaff() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/staff");
      const data = await res.json();
      setStaffList(data.staff || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchStaff(); }, []);

  async function handleDelete(username: string) {
    if (!confirm(`Xóa tài khoản "${username}"?`)) return;
    await fetch("/api/auth/staff", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });
    fetchStaff();
  }

  async function handleResetPassword(username: string) {
    const res = await fetch("/api/auth/staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });
    const data = await res.json();
    if (data.success) {
      setResetResult({ username, newPassword: data.newPassword });
    }
  }

  const roleLabel = (role: string) => {
    if (role === "design") return "Design";
    if (role === "video") return "Video / Editor";
    return role;
  };

  return (
    <div className="fixed inset-0 bg-[rgba(255,255,255,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative bg-white rounded-2xl shadow p-8 w-[500px] max-h-[80vh] overflow-y-auto">
        <button className="absolute top-2 right-2 text-xl text-gray-500 hover:text-pink-600" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold text-pink-600 mb-6">Quản lý nhân viên</h2>

        {resetResult && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-700 font-semibold text-sm">Mật khẩu mới của <span className="font-bold">{resetResult.username}</span>:</div>
            <div className="text-green-900 font-bold text-lg tracking-widest mt-1">{resetResult.newPassword}</div>
            <div className="text-xs text-gray-500 mt-1">Ghi lại và gửi cho nhân viên. Mật khẩu này sẽ biến mất khi đóng thông báo.</div>
            <button className="mt-2 text-xs text-gray-400 hover:text-pink-500 underline" onClick={() => setResetResult(null)}>Đóng thông báo</button>
          </div>
        )}

        {loading ? (
          <div className="text-pink-400 text-center py-8">Đang tải...</div>
        ) : staffList.length === 0 ? (
          <div className="text-gray-400 text-center py-8">Chưa có nhân viên nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pink-100 text-[#6B184E] text-left">
                <th className="py-2 font-semibold">Tên hiển thị</th>
                <th className="py-2 font-semibold">Tài khoản</th>
                <th className="py-2 font-semibold">Bộ phận</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {staffList.map(s => (
                <tr key={s.username} className="border-b border-pink-50 hover:bg-pink-50 transition">
                  <td className="py-2 font-semibold text-[#D81B60]">{s.displayName || s.username}</td>
                  <td className="py-2 text-gray-500">{s.username}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.role === 'design' ? 'bg-pink-100 text-pink-700' : 'bg-sky-100 text-sky-700'}`}>
                      {roleLabel(s.role)}
                    </span>
                  </td>
                  <td className="py-2 flex gap-2 justify-end">
                    <button
                      className="text-xs border border-pink-200 text-pink-600 font-semibold px-3 py-1 rounded-lg hover:bg-pink-50 transition"
                      onClick={() => handleResetPassword(s.username)}
                    >Reset pass</button>
                    <button
                      className="text-xs border border-red-200 text-red-500 font-semibold px-3 py-1 rounded-lg hover:bg-red-50 transition"
                      onClick={() => handleDelete(s.username)}
                    >Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
