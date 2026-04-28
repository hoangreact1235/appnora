export interface OrderDesign {
  id: string;
  department: string;
  size: string;
  type: string;
  content: string;
  createdAt: string;
  status: "pending" | "done";
}

export const mockOrderDesignHistory: OrderDesign[] = [
  {
    id: "1",
    department: "Marketing",
    size: "1080x1080",
    type: "Banner Facebook",
    content: "Thiết kế banner quảng cáo sản phẩm mới, màu chủ đạo #D81B60, CTA nổi bật.",
    createdAt: "2026-04-22T09:00:00Z",
    status: "done",
  },
  {
    id: "2",
    department: "Sale",
    size: "1920x1080",
    type: "Poster",
    content: "Poster chương trình khuyến mãi tháng 5, tông hồng nhạt, nhiều hình ảnh sản phẩm.",
    createdAt: "2026-04-23T14:30:00Z",
    status: "pending",
  },
];
