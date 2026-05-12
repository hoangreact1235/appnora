export type DatePresetKey =
  | "today"
  | "yesterday"
  | "today_yesterday"
  | "custom_day"
  | "7d"
  | "14d"
  | "28d"
  | "30d"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "all";

export const DATE_PRESET_OPTIONS: Array<{ key: DatePresetKey; label: string }> = [
  { key: "today", label: "Hôm nay" },
  { key: "yesterday", label: "Hôm qua" },
  { key: "today_yesterday", label: "Hôm nay và hôm qua" },
  { key: "custom_day", label: "Ngày cụ thể" },
  { key: "7d", label: "7 ngày qua" },
  { key: "14d", label: "14 ngày qua" },
  { key: "28d", label: "28 ngày qua" },
  { key: "30d", label: "30 ngày qua" },
  { key: "this_week", label: "Tuần này" },
  { key: "last_week", label: "Tuần trước" },
  { key: "this_month", label: "Tháng này" },
  { key: "last_month", label: "Tháng trước" },
  { key: "all", label: "Tối đa" },
];

export function getPresetLabel(key: DatePresetKey) {
  return DATE_PRESET_OPTIONS.find((p) => p.key === key)?.label || "Tất cả";
}

export function parseAnyDate(value?: string) {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;

  // Fallback format: HH:mm DD/MM/YYYY
  const m = String(value).match(/^(\d{2}):(\d{2})\s(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, hh, mm, dd, mo, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mo) - 1, Number(dd), Number(hh), Number(mm));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getOrderCreatedDate(order: { createdAt?: string; id?: number }) {
  const created = parseAnyDate(order.createdAt);
  if (created) return created;
  if (typeof order.id === "number" && order.id > 1000000000000) {
    const fromId = new Date(order.id);
    if (!Number.isNaN(fromId.getTime())) return fromId;
  }
  return null;
}

export function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeekMonday(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function endOfWeekSunday(d: Date) {
  const start = startOfWeekMonday(d);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return endOfDay(end);
}

export function inDatePreset(date: Date, preset: DatePresetKey, now = new Date(), customDate?: string) {
  if (preset === "all") return true;

  const targetMs = date.getTime();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (preset === "today") {
    return targetMs >= todayStart.getTime() && targetMs <= todayEnd.getTime();
  }

  if (preset === "yesterday") {
    const y = new Date(todayStart);
    y.setDate(y.getDate() - 1);
    return targetMs >= y.getTime() && targetMs <= endOfDay(y).getTime();
  }

  if (preset === "today_yesterday") {
    const y = new Date(todayStart);
    y.setDate(y.getDate() - 1);
    return targetMs >= y.getTime() && targetMs <= todayEnd.getTime();
  }

  if (preset === "custom_day") {
    if (!customDate) return false;
    const selected = new Date(customDate);
    if (Number.isNaN(selected.getTime())) return false;
    const start = startOfDay(selected);
    const end = endOfDay(selected);
    return targetMs >= start.getTime() && targetMs <= end.getTime();
  }

  if (preset === "7d" || preset === "14d" || preset === "28d" || preset === "30d") {
    const days = preset === "7d" ? 7 : preset === "14d" ? 14 : preset === "28d" ? 28 : 30;
    const start = new Date(todayStart);
    start.setDate(start.getDate() - (days - 1));
    return targetMs >= start.getTime() && targetMs <= todayEnd.getTime();
  }

  if (preset === "this_week") {
    const start = startOfWeekMonday(now);
    const end = endOfWeekSunday(now);
    return targetMs >= start.getTime() && targetMs <= end.getTime();
  }

  if (preset === "last_week") {
    const thisWeekStart = startOfWeekMonday(now);
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - 7);
    const end = new Date(thisWeekStart);
    end.setMilliseconds(-1);
    return targetMs >= start.getTime() && targetMs <= end.getTime();
  }

  if (preset === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    return targetMs >= start.getTime() && targetMs <= end.getTime();
  }

  if (preset === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const end = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
    return targetMs >= start.getTime() && targetMs <= end.getTime();
  }

  return true;
}
