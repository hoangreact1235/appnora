import React from "react";

interface DashboardCardProps {
  order: {
    id: number;
    title: string;
    status: string;
    deadline: string;
    size: string;
    version: string;
    content: string;
  };
  onDelete?: () => void;
  onReceive?: () => void;
  isAdmin?: boolean;
}

const statusColor: Record<string, string> = {
  "Chờ xử lý": "bg-pink-200 text-pink-700",
  "Chờ duyệt": "bg-pink-100 text-pink-700",
  "Hoàn thành": "bg-pink-300 text-pink-900",
};

export default function DashboardCard({ order, onDelete, onReceive, isAdmin = false }: DashboardCardProps) {
  return (
    <div className="border border-pink-200 rounded-xl bg-white p-4 flex flex-col min-w-[180px] max-w-[220px] w-full shadow-sm">
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
      {isAdmin && (
        <div className="w-full flex gap-2 mt-auto justify-center">
          <button className="bg-pink-400 hover:bg-pink-500 text-white font-semibold rounded px-2 py-1 text-sm transition whitespace-nowrap" onClick={onReceive}>Nhận thiết kế</button>
          <button className="border border-pink-300 text-pink-700 font-semibold rounded px-2 py-1 text-sm hover:bg-pink-50 transition whitespace-nowrap" onClick={onDelete}>Xóa order</button>
        </div>
      )}
    </div>
  );
}
