"use client";
import React from "react";
import { mockOrderDesignHistory } from "../mock/orderDesignHistory";
import dayjs from "dayjs";

export default function OrderDesignHistory() {
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold text-[#D81B60] mb-4">Lịch sử Order Design</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-[#F3C1D7] rounded-md">
          <thead>
            <tr className="bg-[#FDE7F0] text-[#D81B60]">
              <th className="px-4 py-2 text-left">Bộ phận</th>
              <th className="px-4 py-2 text-left">Kích thước</th>
              <th className="px-4 py-2 text-left">Loại ấn phẩm</th>
              <th className="px-4 py-2 text-left">Nội dung</th>
              <th className="px-4 py-2 text-left">Ngày tạo</th>
              <th className="px-4 py-2 text-left">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {mockOrderDesignHistory.map((order) => (
              <tr key={order.id} className="border-t border-[#F3C1D7]">
                <td className="px-4 py-2">{order.department}</td>
                <td className="px-4 py-2">{order.size}</td>
                <td className="px-4 py-2">{order.type}</td>
                <td className="px-4 py-2 max-w-xs truncate" title={order.content}>{order.content}</td>
                <td className="px-4 py-2">{dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}</td>
                <td className="px-4 py-2">
                  {order.status === "done" ? (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Hoàn thành</span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">Đang xử lý</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
