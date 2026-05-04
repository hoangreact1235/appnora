"use client";
import React from "react";
import DashboardCard from "./DashboardCard";

interface Order {
  id: number;
  title: string;
  status: string;
  deadline: string;
  size: string;
  version: string;
  content: string;
}

interface DashboardProps {
  type?: "design" | "video";
  orders: Order[];
  isAdmin?: boolean;
}

// Danh sách order mẫu dạng card
const ordersDesign = [
  {
    id: 1,
    title: "HR - Poster",
    status: "Chờ xử lý",
    deadline: "14:04 23/04/2026",
    size: "1080x1080 px",
    version: "V0",
    content: "con mẹ mày làm cho đàng hoàng chứ k đã cuồng hong..."
  },
  {
    id: 2,
    title: "Marketing - Banner",
    status: "Chờ duyệt",
    deadline: "10:00 24/04/2026",
    size: "1920x1080 px",
    version: "V1",
    content: "Thiết kế banner cho chiến dịch summer sale, tông pastel, có..."
  },
  {
    id: 4,
    title: "Design - Poster",
    status: "Chờ xử lý",
    deadline: "09:00 25/04/2026",
    size: "1080x1350 px",
    version: "V1",
    content: "Thiết kế poster cho sự kiện khai trương."
  },
  {
    id: 5,
    title: "Social - Banner",
    status: "Chờ duyệt",
    deadline: "11:00 25/04/2026",
    size: "1200x628 px",
    version: "V2",
    content: "Banner cho Facebook Ads, màu sắc nổi bật."
  },
  {
    id: 7,
    title: "PR - Poster",
    status: "Chờ xử lý",
    deadline: "17:00 25/04/2026",
    size: "1080x1080 px",
    version: "V1",
    content: "Poster truyền thông nội bộ."
  },
  {
    id: 8,
    title: "Recruitment - Banner",
    status: "Chờ duyệt",
    deadline: "19:00 25/04/2026",
    size: "1080x1920 px",
    version: "V2",
    content: "Banner tuyển dụng, phong cách trẻ trung."
  }
];

const ordersVideo = [
  {
    id: 3,
    title: "Content - Video",
    status: "Hoàn thành",
    deadline: "16:00 22/04/2026",
    size: "1080x1920 px",
    version: "V2",
    content: "Video review sản phẩm, có phụ đề, hiệu ứng chuyển cảnh..."
  },
  {
    id: 6,
    title: "Event - Video",
    status: "Hoàn thành",
    deadline: "15:00 25/04/2026",
    size: "1920x1080 px",
    version: "V3",
    content: "Video giới thiệu sự kiện, hiệu ứng động."
  }
];

export default function Dashboard({ type = "video", orders = [], isAdmin = false }: DashboardProps) {
  return (
    <section className="w-full mt-12 mb-16 px-2 sm:px-4 bg-transparent">
      <h2 className="text-2xl font-bold text-[#D81B60] mb-8 text-left uppercase">
        {type === "design" ? "Dashboard Order Design" : "Dashboard Order Video"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-6 w-full">
        {orders.map(order => (
          <DashboardCard key={order.id} order={order} isAdmin={isAdmin} />
        ))}
      </div>
    </section>
  );
}
