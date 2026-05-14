"use client";
import React, { useMemo, useState } from "react";

type DeletedOrder = {
  id: number;
  type: "design" | "video";
  title: string;
  status?: string;
  deadline?: string;
  deletedAt?: string;
  deletedBy?: string;
  deletedByRole?: string;
  deletedReason?: string;
};

type AuditLog = {
  id: number;
  createdAt: string;
  action: string;
  type?: "design" | "video";
  orderId?: number;
  title?: string;
  by?: string;
  byRole?: string;
};

function formatTime(value?: string) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN");
}

export default function DeletedOrdersPopup({
  deletedOrders,
  auditLogs,
  onClose,
  onRestore,
  onPermanentDelete,
}: {
  deletedOrders: DeletedOrder[];
  auditLogs: AuditLog[];
  onClose: () => void;
  onRestore: (type: "design" | "video", orderId: number) => Promise<void>;
  onPermanentDelete: (type: "design" | "video", orderId: number) => Promise<void>;
}) {
  const [busyKey, setBusyKey] = useState<string>("");

  const sortedDeleted = useMemo(
    () => [...(deletedOrders || [])].sort((a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime()),
    [deletedOrders]
  );

  async function handleRestore(type: "design" | "video", orderId: number) {
    const key = `restore-${type}-${orderId}`;
    setBusyKey(key);
    try {
      await onRestore(type, orderId);
    } finally {
      setBusyKey("");
    }
  }

  async function handlePermanentDelete(type: "design" | "video", orderId: number, title: string) {
    if (!window.confirm(`Xóa vĩnh viễn order "${title}"? Hành động này không thể hoàn tác.`)) return;
    const key = `purge-${type}-${orderId}`;
    setBusyKey(key);
    try {
      await onPermanentDelete(type, orderId);
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div className="fixed inset-0 bg-[rgba(255,255,255,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative bg-white rounded-2xl shadow p-6 w-[1180px] max-w-[96vw] max-h-[90vh] overflow-y-auto">
        <button className="absolute top-2 right-2 text-xl text-gray-500 hover:text-pink-600" onClick={onClose}>&times;</button>

        <h2 className="text-2xl font-bold text-pink-600 mb-4">Thùng rác order (Admin)</h2>

        <div className="mb-6">
          {sortedDeleted.length === 0 ? (
            <div className="rounded-xl border border-pink-100 bg-[#FFF8FB] px-4 py-6 text-gray-400">Không có order nào trong thùng rác.</div>
          ) : (
            <div className="overflow-x-auto border border-pink-100 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-[#FFF3F9] text-[#6B184E]">
                  <tr>
                    <th className="text-left px-3 py-2">Order</th>
                    <th className="text-left px-3 py-2">Loại</th>
                    <th className="text-left px-3 py-2">Xóa bởi</th>
                    <th className="text-left px-3 py-2">Thời gian xóa</th>
                    <th className="text-left px-3 py-2">Lý do</th>
                    <th className="text-right px-3 py-2">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDeleted.map((o) => {
                    const restoreKey = `restore-${o.type}-${o.id}`;
                    const purgeKey = `purge-${o.type}-${o.id}`;
                    const isRestoreBusy = busyKey === restoreKey;
                    const isPurgeBusy = busyKey === purgeKey;
                    return (
                      <tr key={`${o.type}-${o.id}`} className="border-t border-pink-50">
                        <td className="px-3 py-2 font-semibold text-[#D81B60]">{o.title}</td>
                        <td className="px-3 py-2">{o.type === "design" ? "Design" : "Video"}</td>
                        <td className="px-3 py-2">{o.deletedBy || "-"}{o.deletedByRole ? ` (${o.deletedByRole})` : ""}</td>
                        <td className="px-3 py-2">{formatTime(o.deletedAt)}</td>
                        <td className="px-3 py-2 text-gray-500">{o.deletedReason || "-"}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-2">
                            <button
                              className="text-xs border border-emerald-200 text-emerald-700 font-semibold px-3 py-1 rounded-lg hover:bg-emerald-50 transition"
                              disabled={isRestoreBusy || isPurgeBusy}
                              onClick={() => handleRestore(o.type, o.id)}
                            >
                              {isRestoreBusy ? "Đang khôi phục..." : "Khôi phục"}
                            </button>
                            <button
                              className="text-xs border border-red-200 text-red-600 font-semibold px-3 py-1 rounded-lg hover:bg-red-50 transition"
                              disabled={isRestoreBusy || isPurgeBusy}
                              onClick={() => handlePermanentDelete(o.type, o.id, o.title)}
                            >
                              {isPurgeBusy ? "Đang xóa..." : "Xóa vĩnh viễn"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="text-xs text-gray-500 mt-2">Tự động dọn order đã xóa quá 60 ngày.</div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#6B184E] mb-2">Audit log gần đây</h3>
          {auditLogs.length === 0 ? (
            <div className="rounded-xl border border-pink-100 bg-[#FFF8FB] px-4 py-4 text-gray-400">Chưa có log.</div>
          ) : (
            <div className="overflow-x-auto border border-pink-100 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-[#FFF3F9] text-[#6B184E]">
                  <tr>
                    <th className="text-left px-3 py-2">Thời gian</th>
                    <th className="text-left px-3 py-2">Hành động</th>
                    <th className="text-left px-3 py-2">Order</th>
                    <th className="text-left px-3 py-2">Loại</th>
                    <th className="text-left px-3 py-2">Thực hiện bởi</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.slice(0, 100).map((log) => (
                    <tr key={log.id} className="border-t border-pink-50">
                      <td className="px-3 py-2">{formatTime(log.createdAt)}</td>
                      <td className="px-3 py-2">{log.action}</td>
                      <td className="px-3 py-2">{log.title || `#${log.orderId || "-"}`}</td>
                      <td className="px-3 py-2">{log.type || "-"}</td>
                      <td className="px-3 py-2">{log.by || "-"}{log.byRole ? ` (${log.byRole})` : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
