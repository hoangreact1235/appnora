"use client";
import React, { useMemo, useState } from "react";
import DashboardCard from "./DashboardCard";
import DatePresetFilter from "./DatePresetFilter";
import { DatePresetKey, getOrderCreatedDate, inDatePreset } from "../utils/datePresetUtils";

interface Order {
  id: number;
  title: string;
  status: string;
  deadline: string;
  size: string;
  version: string;
  content: string;
  finalLink?: string;
  revisionNote?: string;
  receivedBy?: string;
  createdAt?: string;
}

interface DashboardProps {
  type?: "design" | "video";
  orders: Order[];
  isAdmin?: boolean;
  ordererTokens?: Record<number, string>;
  onReceiveOrder?: (id: number) => void;
  onDeleteOrder?: (id: number) => void;
  onSubmitFinal?: (id: number, finalLink: string) => void;
  onRequestRevision?: (id: number, note: string) => void;
  onApproveOrder?: (id: number) => void;
}

function formatGroupLabel(d: Date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  if (target === today) return "Hôm nay";
  if (target === today - oneDay) return "Hôm qua";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default function Dashboard({ type = "video", orders = [], isAdmin = false, ordererTokens = {}, onReceiveOrder, onDeleteOrder, onSubmitFinal, onRequestRevision, onApproveOrder }: DashboardProps) {
  const [filterReceiver, setFilterReceiver] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePresetKey>("today");

  // Lấy danh sách người nhận duy nhất
  const receivers = Array.from(new Set(orders.filter(o => o.receivedBy).map(o => o.receivedBy as string)));

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filterReceiver !== "all" && o.receivedBy !== filterReceiver) return false;
      const created = getOrderCreatedDate(o);
      if (!created) return datePreset === "all";
      return inDatePreset(created, datePreset);
    });
  }, [orders, filterReceiver, datePreset]);

  const groupedOrders = useMemo(() => {
    const map = new Map<string, { label: string; dateValue: number; items: Order[] }>();
    for (const order of filteredOrders) {
      const created = getOrderCreatedDate(order);
      const date = created || new Date(0);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!map.has(key)) {
        map.set(key, { label: formatGroupLabel(date), dateValue: date.getTime(), items: [] });
      }
      map.get(key)!.items.push(order);
    }
    return Array.from(map.values())
      .sort((a, b) => b.dateValue - a.dateValue)
      .map((g) => ({
        ...g,
        items: g.items.sort((a, b) => b.id - a.id),
      }));
  }, [filteredOrders]);

  return (
    <section className="w-full mt-12 mb-16 px-2 sm:px-4 bg-transparent">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-[#D81B60] uppercase">
          {type === "design" ? "Dashboard Order Design" : "Dashboard Order Video"}
        </h2>
        <DatePresetFilter value={datePreset} onChange={setDatePreset} storageKey={`nora_dashboard_${type}_recent_presets`} />
        {receivers.length > 0 && (
          <select
            title="Lọc theo người nhận"
            className="border border-pink-200 rounded-lg px-3 py-1.5 text-[#D81B60] font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
            value={filterReceiver}
            onChange={e => setFilterReceiver(e.target.value)}
          >
            <option value="all">Tất cả</option>
            {receivers.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        )}
      </div>
      {groupedOrders.length === 0 ? (
        <div className="rounded-xl border border-pink-100 bg-white p-6 text-gray-400">Không có order trong khoảng thời gian đã chọn.</div>
      ) : (
        <div className="space-y-8">
          {groupedOrders.map((group) => (
            <div key={`${group.label}-${group.dateValue}`}>
              <div className="mb-3 inline-flex items-center rounded-full bg-pink-50 border border-pink-100 px-3 py-1 text-sm font-semibold text-[#6B184E]">
                {group.label} ({group.items.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-6 w-full">
                {group.items.map((order) => (
                  <DashboardCard
                    key={order.id}
                    order={order}
                    isAdmin={isAdmin}
                    isOrderer={!!ordererTokens[order.id]}
                    onReceive={() => onReceiveOrder?.(order.id)}
                    onDelete={() => onDeleteOrder?.(order.id)}
                    onSubmitFinal={(finalLink) => onSubmitFinal?.(order.id, finalLink)}
                    onRequestRevision={(note) => onRequestRevision?.(order.id, note)}
                    onApprove={() => onApproveOrder?.(order.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
