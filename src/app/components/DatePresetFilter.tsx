"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { DATE_PRESET_OPTIONS, DatePresetKey, getPresetLabel } from "../utils/datePresetUtils";

export default function DatePresetFilter({
  value,
  onChange,
  customDate,
  onCustomDateChange,
  storageKey,
  label = "Đã dùng mới đây",
}: {
  value: DatePresetKey;
  onChange: (value: DatePresetKey) => void;
  customDate?: string;
  onCustomDateChange?: (value: string) => void;
  storageKey: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [recent, setRecent] = useState<DatePresetKey[]>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((x) => DATE_PRESET_OPTIONS.some((p) => p.key === x)).slice(0, 3);
        setRecent(cleaned as DatePresetKey[]);
      }
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const recentOptions = useMemo(
    () => recent.map((k) => DATE_PRESET_OPTIONS.find((p) => p.key === k)).filter(Boolean),
    [recent]
  );

  function toggleOpen() {
    if (!open && wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      const approxHeight = 360;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpward(spaceBelow < approxHeight && spaceAbove > spaceBelow);
    }
    setOpen((s) => !s);
  }

  function applyPreset(next: DatePresetKey) {
    onChange(next);
    const merged = [next, ...recent.filter((r) => r !== next)].slice(0, 3);
    setRecent(merged);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(merged));
    } catch {}
    setOpen(false);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        className="border border-pink-200 rounded-lg px-3 py-1.5 text-[#D81B60] font-semibold text-sm hover:bg-pink-50"
        onClick={toggleOpen}
      >
        {getPresetLabel(value)} <span className="ml-1">▾</span>
      </button>

      {open && (
        <div className={`absolute right-0 w-[260px] max-h-[320px] overflow-y-auto rounded-xl border border-pink-100 bg-white shadow-lg z-50 p-3 ${openUpward ? "bottom-full mb-2" : "top-full mt-2"}`}>
          {recentOptions.length > 0 && (
            <>
              <div className="text-sm font-semibold text-[#6B184E] mb-2">{label}</div>
              <div className="flex flex-col gap-2">
                {recentOptions.map((opt) => {
                  if (!opt) return null;
                  const active = value === opt.key;
                  return (
                    <button
                      key={`recent-${opt.key}`}
                      className="flex items-center gap-2 text-left text-[#374151]"
                      onClick={() => applyPreset(opt.key)}
                    >
                      <span className={`inline-block w-5 h-5 rounded-full border ${active ? "border-blue-500" : "border-gray-300"}`}>
                        {active && <span className="block w-3 h-3 rounded-full bg-blue-500 mt-1 ml-1" />}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-gray-200 my-3" />
            </>
          )}

          <div className="flex flex-col gap-2">
            {DATE_PRESET_OPTIONS.map((opt) => {
              const active = value === opt.key;
              return (
                <button
                  key={opt.key}
                  className="flex items-center gap-2 text-left text-[#374151]"
                  onClick={() => applyPreset(opt.key)}
                >
                  <span className={`inline-block w-5 h-5 rounded-full border ${active ? "border-blue-500" : "border-gray-300"}`}>
                    {active && <span className="block w-3 h-3 rounded-full bg-blue-500 mt-1 ml-1" />}
                  </span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-200 my-3" />
          <div className="text-sm font-semibold text-[#6B184E] mb-2">Chọn từng ngày</div>
          <input
            type="date"
            aria-label="Chọn ngày cụ thể"
            title="Chọn ngày cụ thể"
            value={customDate || ""}
            onChange={(e) => {
              const picked = e.target.value;
              onCustomDateChange?.(picked);
              if (picked) applyPreset("custom_day");
            }}
            className="w-full rounded-lg border border-pink-200 px-3 py-2 text-sm text-[#6B184E] focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
        </div>
      )}
    </div>
  );
}
