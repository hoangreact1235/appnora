import React from "react";
import Image from "next/image";
// Brand Identity block riêng biệt

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onShowLogin?: () => void;
  admin?: any;
  onLogout?: () => void;
  onShowCreateUser?: () => void;
  onShowStaffManagement?: () => void;
  onShowOpsStats?: () => void;
  onShowDeletedOrders?: () => void;
  onShowNotification?: () => void;
  notificationCount?: number;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onShowLogin, admin, onLogout, onShowCreateUser, onShowStaffManagement, onShowOpsStats, onShowDeletedOrders, onShowNotification, notificationCount = 0 }) => {
  // Xác định tên hiển thị
  let displayName = '';
  if (admin) {
    if (admin.username === 'hoangleadermedia') displayName = 'Hoàng Leader';
    else if (admin.displayName) displayName = admin.displayName;
    else displayName = admin.username;
  }
  return (
    <header className="w-full bg-[#FDE7F0] pb-2">
      <div className="w-full px-0 pt-6 pb-2">
        {/* Khối trên: 2 bên đối xứng */}
        <div className="flex flex-row justify-between items-start gap-8 w-full px-8">
          {/* Bên trái */}
          <div className="flex flex-col min-w-[320px] max-w-[420px]">
            <div className="flex flex-col items-start mb-1">
              <div className="bg-white rounded-2xl shadow mb-2 border-4 border-white flex items-center justify-center" style={{height: '70px', width: '380px', padding: 0}}>
                <Image src="/logo-nora-care-pink-clean.png" alt="Nora Care Logo" width={320} height={60} style={{objectFit:'contain', borderRadius: '16px', background: '#fff', width: '320px', height: '60px', display: 'block', margin: 0, padding: 0}} priority />
              </div>
              <h1 className="text-[2rem] leading-[2.3rem] font-extrabold text-[#6B184E] tracking-tight whitespace-nowrap uppercase" style={{letterSpacing:0, fontFamily:'Inter, Arial, Helvetica, sans-serif'}}>MEDIA NORA CARE</h1>
            </div>
            <span className="text-[1.05rem] text-[#6B184E] font-medium mb-2" style={{fontFamily:'Inter, Arial, Helvetica, sans-serif'}}>Quản lý yêu cầu thiết kế, video nội bộ Nora Care, rõ ràng và dễ theo dõi.</span>
          </div>
          {/* Bên phải */}
          <div className="flex flex-col items-end gap-2 flex-1 min-w-[320px]">
            {/* Tầng 1: Search */}
            <div className="flex flex-row items-center w-full justify-end mb-1">
              <div className="relative w-[270px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D81B60] text-lg">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="#D81B60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </span>
                <input type="text" placeholder="Tìm kiếm order/video..." className="pl-10 pr-4 py-2 rounded-full bg-white text-[#6B184E] placeholder-[#B97BA6] w-full border-none outline-none shadow-sm focus:ring-2 focus:ring-[#F8BBD0]" />
              </div>
            </div>
            {/* Tầng 2: 2 nút trắng */}
            <div className="flex flex-row gap-2 w-full justify-end">
              {admin && (
                <button className="bg-white text-[#D81B60] font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-[#FDE7F0] transition relative" onClick={onShowNotification}>
                  Thông báo
                  {notificationCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{notificationCount}</span>
                  )}
                </button>
              )}
              {admin?.role === 'admin' && (
                <button className="bg-white text-[#6B184E] font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-[#FDE7F0] transition" onClick={onShowOpsStats}>THỐNG KÊ VẬN HÀNH <span className="ml-1">▼</span></button>
              )}
              {admin?.role === 'admin' && (
                <button className="bg-white text-[#6B184E] font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-[#FDE7F0] transition" onClick={onShowDeletedOrders}>THÙNG RÁC ORDER</button>
              )}
            </div>
            {/* Tầng 3: Đăng nhập + mô tả nhỏ */}
            <div className="flex flex-row gap-2 w-full justify-end items-center mt-1">
              {!admin && <span className="text-xs text-[#6B184E] mr-1">Người order design/video không cần đăng nhập</span>}
              {admin ? (
                <>
                  <span className="flex items-center gap-2">
                    <span className="border border-pink-200 bg-white text-[#D81B60] font-semibold px-4 py-2 rounded-lg shadow-sm transition">
                      {displayName}
                    </span>
                    {admin.role === 'admin' && (
                      <>
                        <button className="border border-pink-200 bg-white text-[#D81B60] font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-pink-100 transition" onClick={onShowCreateUser}>
                          Tạo tài khoản nhân viên
                        </button>
                        <button className="border border-pink-200 bg-white text-[#D81B60] font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-pink-100 transition" onClick={onShowStaffManagement}>
                          Quản lý nhân viên
                        </button>
                      </>
                    )}
                    <button className="border border-pink-200 bg-white text-[#D81B60] font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-pink-100 transition" onClick={onLogout}>
                      Đăng xuất
                    </button>
                  </span>
                </>
              ) : (
                <button className="bg-[#fff] text-[#D81B60] font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-[#FDE7F0] transition" onClick={onShowLogin}>Đăng nhập nội bộ</button>
              )}
            </div>
          </div>
        </div>
        {/* Dải tab phía dưới */}
        <div className="flex flex-row gap-3 mt-6 w-full px-8">
          {(!admin || admin.role === 'admin' || admin.role === 'design') && (
            <button
              className={`px-5 py-2 rounded-lg font-semibold shadow-sm transition ${activeTab === 'order-design' ? 'bg-[#D81B60] text-white' : 'bg-[#F8BBD0] text-[#6B184E]'}`}
              onClick={() => onTabChange('order-design')}
            >Order Design</button>
          )}
          {(!admin || admin.role === 'admin' || admin.role === 'video') && (
            <button
              className={`px-5 py-2 rounded-lg font-semibold shadow-sm transition ${activeTab === 'order-video' ? 'bg-[#D81B60] text-white' : 'bg-[#F8BBD0] text-[#6B184E]'}`}
              onClick={() => onTabChange('order-video')}
            >Order Video</button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
