"use client";
import React, { useMemo, useState } from "react";
import DatePresetFilter from "./DatePresetFilter";
import { DatePresetKey, getOrderCreatedDate, inDatePreset, parseAnyDate, toDateKey } from "../utils/datePresetUtils";

type StatsOrder = {
  id: number;
  title: string;
  status: string;
  deadline: string;
  receivedBy?: string;
  revisionNote?: string;
  createdAt?: string;
  receivedAt?: string;
  completedAt?: string;
  finalLink?: string;
  type: "design" | "video";
};

function isDoneStatus(status: string) {
  return status === "Hoàn thành" || status === "Đã duyệt";
}

export default function OperationsStatsPopup({
  ordersDesign,
  ordersVideo,
  onClose,
}: {
  ordersDesign: any[];
  ordersVideo: any[];
  onClose: () => void;
}) {
  const [range, setRange] = useState<DatePresetKey>("today");
  const [customDate, setCustomDate] = useState<string>("");

  function handleRangeChange(next: DatePresetKey) {
    setRange(next);
    if (next === "custom_day" && !customDate) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      setCustomDate(`${yyyy}-${mm}-${dd}`);
    }
  }

  const allOrders: StatsOrder[] = useMemo(
    () => [
      ...ordersDesign.map((o) => ({ ...o, type: "design" as const })),
      ...ordersVideo.map((o) => ({ ...o, type: "video" as const })),
    ],
    [ordersDesign, ordersVideo]
  );

  const filteredOrders = useMemo(() => {
    return allOrders.filter((o) => {
      const created = getOrderCreatedDate(o);
      if (!created) return range === "all";
      return inDatePreset(created, range, new Date(), customDate);
    });
  }, [allOrders, range, customDate]);

  const kpi = useMemo(() => {
    const total = filteredOrders.length;
    const waiting = filteredOrders.filter((o) => o.status === "Chờ xử lý").length;
    const received = filteredOrders.filter((o) => o.status === "Đã nhận").length;
    const done = filteredOrders.filter((o) => isDoneStatus(o.status)).length;
    const needRevision = filteredOrders.filter((o) => o.status === "Cần sửa").length;
    const approved = filteredOrders.filter((o) => o.status === "Đã duyệt").length;

    const now = new Date();
    const overdue = filteredOrders.filter((o) => {
      if (isDoneStatus(o.status)) return false;
      const deadline = parseAnyDate(o.deadline);
      return !!deadline && deadline.getTime() < now.getTime();
    }).length;

    const revisionCount = filteredOrders.filter((o) => !!o.revisionNote || o.status === "Cần sửa").length;
    const revisionRate = total > 0 ? (revisionCount / total) * 100 : 0;

    const leadDays = filteredOrders
      .map((o) => {
        const receivedAt = parseAnyDate(o.receivedAt);
        const completedAt = parseAnyDate(o.completedAt);
        if (!receivedAt || !completedAt) return null;
        return (completedAt.getTime() - receivedAt.getTime()) / (24 * 60 * 60 * 1000);
      })
      .filter((v): v is number => v !== null && Number.isFinite(v) && v >= 0);

    const avgLeadDays = leadDays.length > 0 ? leadDays.reduce((a, b) => a + b, 0) / leadDays.length : 0;

    return {
      total,
      waiting,
      received,
      done,
      needRevision,
      approved,
      overdue,
      revisionRate,
      avgLeadDays,
    };
  }, [filteredOrders]);

  const staffStats = useMemo(() => {
    const names = Array.from(new Set(filteredOrders.map((o) => o.receivedBy).filter(Boolean) as string[]));
    return names
      .map((name) => {
        const mine = filteredOrders.filter((o) => o.receivedBy === name);
        const inProgress = mine.filter((o) => o.status === "Đã nhận" || o.status === "Cần sửa").length;
        const completed = mine.filter((o) => isDoneStatus(o.status)).length;
        const revisions = mine.filter((o) => !!o.revisionNote || o.status === "Cần sửa").length;
        const overdue = mine.filter((o) => {
          if (isDoneStatus(o.status)) return false;
          const d = parseAnyDate(o.deadline);
          return !!d && d.getTime() < Date.now();
        }).length;
        return { name, assigned: mine.length, inProgress, completed, revisions, overdue };
      })
      .sort((a, b) => b.assigned - a.assigned);
  }, [filteredOrders]);

  const trend = useMemo(() => {
    const days = 7;
    const list: { key: string; label: string; created: number; completed: number }[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = toDateKey(d);
      list.push({ key, label: `${d.getDate()}/${d.getMonth() + 1}`, created: 0, completed: 0 });
    }

    const map = new Map(list.map((x) => [x.key, x]));
    for (const o of allOrders) {
      const created = parseAnyDate(o.createdAt) || (typeof o.id === "number" && o.id > 1000000000000 ? new Date(o.id) : null);
      if (created) {
        const c = map.get(toDateKey(created));
        if (c) c.created += 1;
      }
      const completed = parseAnyDate(o.completedAt);
      if (completed) {
        const c = map.get(toDateKey(completed));
        if (c) c.completed += 1;
      }
    }
    return list;
  }, [allOrders]);

  function exportCsv() {
    const rows = filteredOrders.map((o) => [
      o.type,
      o.title,
      o.status,
      o.deadline || "",
      o.receivedBy || "",
      o.createdAt || "",
      o.receivedAt || "",
      o.completedAt || "",
      o.revisionNote || "",
      o.finalLink || "",
    ]);
    const header = ["type", "title", "status", "deadline", "receivedBy", "createdAt", "receivedAt", "completedAt", "revisionNote", "finalLink"];
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replaceAll("\"", "\"\"")}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nora-ops-${range}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 bg-[rgba(255,255,255,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative bg-white rounded-2xl shadow p-6 w-[1080px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <button className="absolute top-2 right-2 text-xl text-gray-500 hover:text-pink-600" onClick={onClose}>&times;</button>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="text-2xl font-bold text-pink-600">Thống kê vận hành</h2>
          <div className="flex items-center gap-2">
            <DatePresetFilter
              value={range}
              onChange={handleRangeChange}
              customDate={customDate}
              onCustomDateChange={setCustomDate}
              storageKey="nora_ops_recent_presets"
            />
            <button
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-4 py-2 rounded-lg"
              onClick={exportCsv}
            >Xuất CSV</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl border border-pink-100 p-3 bg-pink-50"><div className="text-xs text-[#6B184E]">Tổng order</div><div className="text-2xl font-bold text-[#D81B60]">{kpi.total}</div></div>
          <div className="rounded-xl border border-pink-100 p-3 bg-pink-50"><div className="text-xs text-[#6B184E]">Chờ xử lý</div><div className="text-2xl font-bold text-[#6B184E]">{kpi.waiting}</div></div>
          <div className="rounded-xl border border-pink-100 p-3 bg-pink-50"><div className="text-xs text-[#6B184E]">Đang làm</div><div className="text-2xl font-bold text-[#6B184E]">{kpi.received + kpi.needRevision}</div></div>
          <div className="rounded-xl border border-pink-100 p-3 bg-pink-50"><div className="text-xs text-[#6B184E]">Hoàn thành / Duyệt</div><div className="text-2xl font-bold text-emerald-600">{kpi.done}</div></div>
          <div className="rounded-xl border border-pink-100 p-3 bg-pink-50"><div className="text-xs text-[#6B184E]">Cần sửa</div><div className="text-2xl font-bold text-amber-600">{kpi.needRevision}</div></div>
          <div className="rounded-xl border border-pink-100 p-3 bg-pink-50"><div className="text-xs text-[#6B184E]">Quá hạn</div><div className="text-2xl font-bold text-red-500">{kpi.overdue}</div></div>
          <div className="rounded-xl border border-pink-100 p-3 bg-pink-50"><div className="text-xs text-[#6B184E]">Tỷ lệ cần sửa</div><div className="text-2xl font-bold text-[#6B184E]">{kpi.revisionRate.toFixed(1)}%</div></div>
          <div className="rounded-xl border border-pink-100 p-3 bg-pink-50"><div className="text-xs text-[#6B184E]">TB hoàn thành</div><div className="text-2xl font-bold text-[#6B184E]">{kpi.avgLeadDays.toFixed(1)} ngày</div></div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold text-[#6B184E] mb-2">Xu hướng 7 ngày gần nhất</h3>
          <div className="overflow-x-auto border border-pink-100 rounded-xl bg-[#FFF8FB]">
            <table className="w-full text-sm">
              <thead className="text-[#6B184E] bg-pink-50">
                <tr>
                  {trend.map((d) => (
                    <th key={`h-${d.key}`} className="px-2 py-2 text-center font-semibold">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-pink-100">
                  {trend.map((d) => (
                    <td key={`c-${d.key}`} className="px-2 py-2 text-center text-pink-600 font-semibold">{d.created}</td>
                  ))}
                </tr>
                <tr className="border-t border-pink-100">
                  {trend.map((d) => (
                    <td key={`d-${d.key}`} className="px-2 py-2 text-center text-emerald-600 font-semibold">{d.completed}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-500 mt-1">Dòng 1: tạo mới, dòng 2: hoàn thành</div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-[#6B184E] mb-2">Hiệu suất nhân viên (theo người nhận order)</h3>
          {staffStats.length === 0 ? (
            <div className="text-gray-400 border border-pink-100 rounded-xl p-4">Chưa có dữ liệu người nhận order trong khoảng thời gian đã chọn.</div>
          ) : (
            <div className="overflow-x-auto border border-pink-100 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-[#FFF3F9] text-[#6B184E]">
                  <tr>
                    <th className="text-left px-3 py-2">Nhân viên</th>
                    <th className="text-right px-3 py-2">Được giao</th>
                    <th className="text-right px-3 py-2">Đang làm</th>
                    <th className="text-right px-3 py-2">Hoàn thành</th>
                    <th className="text-right px-3 py-2">Cần sửa</th>
                    <th className="text-right px-3 py-2">Quá hạn</th>
                  </tr>
                </thead>
                <tbody>
                  {staffStats.map((s) => (
                    <tr key={s.name} className="border-t border-pink-50">
                      <td className="px-3 py-2 font-semibold text-[#D81B60]">{s.name}</td>
                      <td className="px-3 py-2 text-right">{s.assigned}</td>
                      <td className="px-3 py-2 text-right">{s.inProgress}</td>
                      <td className="px-3 py-2 text-right text-emerald-600 font-semibold">{s.completed}</td>
                      <td className="px-3 py-2 text-right text-amber-600 font-semibold">{s.revisions}</td>
                      <td className="px-3 py-2 text-right text-red-500 font-semibold">{s.overdue}</td>
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
