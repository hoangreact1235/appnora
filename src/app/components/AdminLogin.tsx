"use client";
import React, { useState } from "react";

export default function AdminLogin({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onLogin(data);
      } else {
        setError(data.error || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Lỗi kết nối server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md w-[380px] mx-auto mt-16 p-8 bg-white rounded-2xl shadow flex flex-col gap-5">
      <h2 className="text-2xl font-bold text-pink-600 mb-2">Đăng nhập tài khoản nội bộ</h2>
      <input
        className="border rounded px-3 py-2 placeholder:text-[#D81B60] placeholder:font-semibold text-[#D81B60] font-semibold"
        placeholder="Tên đăng nhập"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
      />
      <input
        className="border rounded px-3 py-2 placeholder:text-[#D81B60] placeholder:font-semibold text-[#D81B60] font-semibold"
        placeholder="Mật khẩu"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <button
        type="submit"
        className="bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded px-4 py-2 mt-2"
        disabled={loading}
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
