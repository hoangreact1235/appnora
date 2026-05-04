import React, { useEffect, useState } from "react";

interface DashboardCardProps {
  order: {
    id: number;
    title: string;
    status: string;
    deadline: string;
    size: string;
    version: string;
    content: string;
    finalLink?: string;
    revisionNote?: string;
  };
  onDelete?: () => void;
  onReceive?: () => void;
  onSubmitFinal?: (finalLink: string) => void;
  onRequestRevision?: (note: string) => void;
  onApprove?: () => void;
  isAdmin?: boolean;
}

const statusColor: Record<string, string> = {
  "Chờ xử lý": "bg-pink-200 text-pink-700",
  "Chờ duyệt": "bg-pink-100 text-pink-700",
  "Đã nhận": "bg-emerald-100 text-emerald-700",
  "Hoàn thành": "bg-pink-300 text-pink-900",
  "Đã duyệt": "bg-sky-100 text-sky-700",
};

export default function DashboardCard({ order, onDelete, onReceive, onSubmitFinal, onRequestRevision, onApprove, isAdmin = false }: DashboardCardProps) {
  const [finalLink, setFinalLink] = useState(order.finalLink || "");
  const [revisionNote, setRevisionNote] = useState("");

  useEffect(() => {
    setFinalLink(order.finalLink || "");
  }, [order.finalLink]);

  return (
    <div
      id={`order-${order.id}`}
      data-order-title={order.title.toLowerCase()}
      className="border border-pink-200 rounded-xl bg-white p-4 flex flex-col min-w-[180px] max-w-[220px] w-full shadow-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold text-[#6B184E] text-base">{order.title}</div>
        <span className={`px-3 py-1 rounded-lg text-xs font-semibold ml-2 whitespace-nowrap ${statusColor[order.status] || "bg-gray-100 text-gray-500"}`}>{order.status}</span>
      </div>
      <div className="text-[15px] mb-1 font-semibold text-[#6B184E]">Deadline: <span className="font-normal">{order.deadline}</span></div>
      <div className="text-[15px] mb-1 font-semibold text-[#6B184E]">Kích thước: <span className="font-normal whitespace-nowrap">{order.size}</span></div>
      <div className="text-[15px] mb-1 font-semibold text-[#6B184E]">Phiên bản: <span className="font-normal">{order.version}</span></div>
      <div className="text-[15px] mb-2 font-semibold text-[#6B184E]">Nội dung yêu cầu:<br/>
        <span className="block text-[#6B184E] whitespace-pre-line line-clamp-3 font-normal">{order.content}</span>
      </div>
      {!!order.revisionNote && (
        <div className="text-[13px] mb-2 text-[#6B184E]">
          <span className="font-semibold">Yêu cầu sửa: </span>
          <span>{order.revisionNote}</span>
        </div>
      )}
      {!!order.finalLink && (
        <div className="text-[13px] mb-2 text-[#6B184E] break-all">
          <span className="font-semibold">Link final: </span>
          <a className="text-[#D81B60] underline" href={order.finalLink} target="_blank" rel="noreferrer">Mở file</a>
        </div>
      )}
      {isAdmin && order.status === "Chờ xử lý" && (
        <div className="w-full flex gap-2 mt-auto justify-center">
          <button className="bg-pink-400 hover:bg-pink-500 text-white font-semibold rounded px-2 py-1 text-sm transition whitespace-nowrap" onClick={onReceive}>Nhận thiết kế</button>
          <button className="border border-pink-300 text-pink-700 font-semibold rounded px-2 py-1 text-sm hover:bg-pink-50 transition whitespace-nowrap" onClick={onDelete}>Xóa order</button>
        </div>
      )}
      {isAdmin && (order.status === "Đã nhận" || order.status === "Cần sửa") && (
        <div className="w-full mt-auto">
          <input
            type="url"
            value={finalLink}
            onChange={(e) => setFinalLink(e.target.value)}
            placeholder="Dán link final..."
            className="w-full mb-2 rounded border border-pink-300 bg-white px-2 py-1 text-sm text-[#6B184E] placeholder:text-[#8E5A7A] outline-none focus:ring-2 focus:ring-pink-400"
          />
          <div className="flex gap-2 justify-center">
            <button
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded px-2 py-1 text-sm transition whitespace-nowrap"
              onClick={() => onSubmitFinal?.(finalLink.trim())}
            >
              {order.status === "Cần sửa" ? "Trả bản sửa" : "Trả final"}
            </button>
            <button className="border border-pink-300 text-pink-700 font-semibold rounded px-2 py-1 text-sm hover:bg-pink-50 transition whitespace-nowrap" onClick={onDelete}>Xóa order</button>
          </div>
        </div>
      )}
      {!isAdmin && order.status === "Hoàn thành" && (
        <div className="w-full mt-auto">
          <textarea
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            placeholder="Ghi nội dung cần sửa..."
            className="w-full mb-2 rounded border border-pink-300 bg-white px-2 py-1 text-sm text-[#6B184E] placeholder:text-[#8E5A7A] outline-none focus:ring-2 focus:ring-pink-400 min-h-[64px]"
          />
          <div className="flex gap-2">
            <button
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded px-2 py-1 text-sm transition"
              onClick={() => {
                const note = revisionNote.trim();
                if (!note) return;
                onRequestRevision?.(note);
                setRevisionNote("");
              }}
            >
              Yêu cầu sửa
            </button>
            <button
              className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded px-2 py-1 text-sm transition"
              onClick={onApprove}
            >
              Hoàn thành
            </button>
          </div>
        </div>
      )}
      {!isAdmin && order.status === "Cần sửa" && (
        <div className="w-full mt-auto">
          <div className="text-[13px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 text-center">
            Đã gửi yêu cầu sửa, vui lòng chờ bản mới.
          </div>
        </div>
      )}
      {!isAdmin && order.status === "Đã duyệt" && (
        <div className="w-full mt-auto">
          <div className="text-[13px] text-sky-700 bg-sky-50 border border-sky-200 rounded px-2 py-1 text-center">
            Order đã được xác nhận hoàn thành.
          </div>
        </div>
      )}
      {isAdmin && order.status === "Hoàn thành" && (
        <div className="w-full flex gap-2 mt-auto justify-center">
          <button className="border border-pink-300 text-pink-700 font-semibold rounded px-2 py-1 text-sm hover:bg-pink-50 transition whitespace-nowrap" onClick={onDelete}>Xóa order</button>
        </div>
      )}
    </div>
  );
}
