export interface OrderVideo {
  id: string;
  department: string;
  size: string;
  type: string;
  content: string;
  createdAt: string;
  status: "pending" | "done";
}

export const mockOrderVideoHistory: OrderVideo[] = [
  {
    id: "1",
    department: "Marketing",
    size: "9:16",
    type: "TikTok Review",
    content: "Video review sản phẩm mới, cần hiệu ứng chuyển cảnh nhanh, nhạc nền trẻ trung.",
    createdAt: "2026-04-22T10:00:00Z",
    status: "done",
  },
  {
    id: "2",
    department: "Sale",
    size: "16:9",
    type: "Video Quảng Cáo",
    content: "Video quảng cáo chương trình sale tháng 5, cần nhiều hiệu ứng chữ động.",
    createdAt: "2026-04-23T15:30:00Z",
    status: "pending",
  },
];
