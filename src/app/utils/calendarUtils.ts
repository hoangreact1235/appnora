import React from "react";

export function getDaysInMonth(month: number, year: number) {
  // month: 1-12
  return new Date(year, month, 0).getDate();
}

export function getFirstDayOfWeek(month, year) {
  // Trả về thứ trong tuần của ngày đầu tháng (0=Chủ Nhật, 1=Thứ Hai,...)
  return new Date(year, month, 1).getDay();
}

export function getWeekdaysVi() {
  return ["Thứ hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
}
