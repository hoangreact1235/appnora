import React from "react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { key: "order-design", label: "Order Design" },
  { key: "order-video", label: "Order Video" },
  { key: "calendar", label: "Lịch đăng TikTok" },
  { key: "report", label: "Báo cáo TikTok" },
];

export default function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="flex gap-3 mt-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={
            activeTab === tab.key
              ? "rounded-md px-4 py-2 font-semibold bg-[#D81B60] text-white shadow"
              : "rounded-md px-4 py-2 font-semibold border border-[#D81B60] text-[#D81B60] bg-white hover:bg-[#FDE7F0] transition"
          }
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
