"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { FiUpload } from "react-icons/fi";

const VIDEO_TYPE_SUGGESTIONS = [
  "Video review",
  "Video tuyển dụng",
  "Video ads",
  "Video TikTok",
];

const VIDEO_SIZE_RATIO_SUGGESTIONS = [
  "9:16 -> video dọc (TikTok, Reels, Story)",
  "16:9 -> video ngang YouTube",
  "1:1 -> video vuông",
];

interface OrderVideoFormData {
  department: string;
  type: string;
  size: string;
  deadline: string;
  document?: FileList;
  file?: FileList;
  content: string;
}

export default function OrderVideoForm({ onCreate }: { onCreate?: (order: any) => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<OrderVideoFormData>();
  const [draft, setDraft] = useState<OrderVideoFormData | null>(null);

  const onSubmit = async (data: OrderVideoFormData) => {
    toast.info("Đang gửi yêu cầu video...");
    await new Promise((r) => setTimeout(r, 1200));
    const orderId = Date.now();
    if (onCreate) {
      const attachments = [];
      const docValue = typeof data.document === 'string' ? data.document : '';
      if (docValue?.trim()) {
        attachments.push({ type: 'text', name: 'Tài liệu', url: docValue });
      }
      if (data.file && data.file.length > 0) {
        const fileList = Array.from(data.file);
        fileList.forEach((f: any) => {
          attachments.push({ type: 'file', name: f.name, size: f.size });
        });
      }
      onCreate({
        ...data,
        id: orderId,
        title: `${data.department} - ${data.type}`,
        status: "Chờ xử lý",
        deadline: data.deadline,
        size: data.size,
        version: "V0",
        content: data.content,
        attachments: attachments.length > 0 ? attachments : undefined
      });
    }
    try {
      const audio = new Audio("/thongbao.mp3");
      audio.play();
    } catch {}
    toast.success("Gửi order video thành công!");
    reset();
  };

  const quickDelete = () => {
    reset();
    toast.info("Đã xóa nhanh nội dung!");
  };

  return (
    <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Cột trái */}
      <div className="flex flex-col gap-4">

        <label className="font-semibold text-[#D81B60] mt-0">Tên bộ phận *</label>
        <input {...register("department", { required: true })} placeholder="VD: Marketing" className="rounded-md border border-[#F3C1D7] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D81B60] placeholder:text-[#B97BA6] placeholder:font-medium text-[#D81B60] bg-[#FDE7F0]" />

        <label className="font-semibold text-[#D81B60]">Loại video *</label>
        <input
          {...register("type", { required: true })}
          list="video-type-suggestions"
          placeholder="Nhập loại video..."
          className="rounded-md border border-[#F3C1D7] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D81B60] placeholder:text-[#B97BA6] placeholder:font-medium text-[#D81B60] bg-[#FDE7F0]"
        />
        <datalist id="video-type-suggestions">
          {VIDEO_TYPE_SUGGESTIONS.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>

        <label className="font-semibold text-[#D81B60]">Kích thước (Tỉ lệ) *</label>
        <input
          {...register("size", { required: true })}
          list="video-size-ratio-suggestions"
          placeholder="Nhập kích thước hoặc tỉ lệ..."
          className="rounded-md border border-[#F3C1D7] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D81B60] placeholder:text-[#B97BA6] placeholder:font-medium text-[#D81B60] bg-[#FDE7F0]"
        />
        <datalist id="video-size-ratio-suggestions">
          {VIDEO_SIZE_RATIO_SUGGESTIONS.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>

        <label className="font-semibold text-[#D81B60]">Deadline *</label>
        <input
          type="datetime-local"
          {...register("deadline", { required: true })}
          placeholder="Chọn deadline..."
          className="rounded-md border border-[#F3C1D7] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D81B60] placeholder:text-[#B97BA6] placeholder:font-medium text-[#B97BA6] bg-[#FDE7F0] appearance-none"
          onFocus={e => e.target.showPicker && e.target.showPicker()}
        />

        <label className="font-medium text-[#D81B60]">Tài liệu đính kèm (nếu có)</label>
        <input type="text" {...register("document")}
          placeholder="Nhập link hoặc mô tả tài liệu..."
          className="rounded-md border border-[#F3C1D7] px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#D81B60] placeholder:text-[#B97BA6] placeholder:font-medium text-[#D81B60] bg-[#FDE7F0]" />

        <label className="text-[#D81B60] font-normal">File đính kèm (docs, pdf... tối đa 15MB)</label>
        <div className="rounded-md border border-[#F3C1D7] bg-[#FDE7F0] p-2 flex items-center gap-2">
          <input
            type="file"
            {...register("file")}
            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#F8BBD0] file:text-[#D81B60] hover:file:bg-[#F3C1D7] bg-transparent"
          />
        </div>
        <div className="flex gap-2 mt-2">
          <button type="submit" className="bg-[#D81B60] text-white font-bold rounded-md px-4 py-2 shadow hover:bg-[#b0154d] transition" disabled={isSubmitting}>
            {isSubmitting ? "Đang gửi..." : "Tạo order"}
          </button>
          <button type="button" className="bg-[#FDE7F0] text-[#D81B60] font-semibold rounded-md px-4 py-2 border border-[#D81B60] hover:bg-[#F3C1D7] transition" onClick={quickDelete}>
            Xóa nhanh
          </button>
        </div>
      </div>
      {/* Cột phải */}
      <div className="flex flex-col gap-4">
        <label className="font-semibold text-[#D81B60]">Nội dung thiết kế *</label>
        <textarea {...register("content", { required: true })}
          placeholder="Nhập mô tả chi tiết: ý tưởng, màu sắc, nội dung, CTA..."
          className="rounded-md border border-[#F3C1D7] px-4 py-2 min-h-[540px] focus:outline-none focus:ring-2 focus:ring-[#D81B60] placeholder:text-[#B97BA6] placeholder:font-medium text-[#D81B60] bg-[#FDE7F0]"
        />
      </div>
    </form>
  );
}
