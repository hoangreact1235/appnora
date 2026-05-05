"use client";
import React, { useState, useEffect, Suspense, useRef } from "react";
import Header from "./components/Header";
import AdminLogin from "./components/AdminLogin";
import OrderDesignForm from "./components/OrderDesignForm";
import OrderDesignHistory from "./components/OrderDesignHistory";
import OrderVideoForm from "./components/OrderVideoForm";
import OrderVideoHistory from "./components/OrderVideoHistory";
import Dashboard from "./components/Dashboard";

import CreateUserPopup from "./components/CreateUserPopup";
import StaffManagement from "./components/StaffManagement";
import NotificationPopup from "./components/NotificationPopup";
export default function Home() {
  const [activeTab, setActiveTab] = useState("order-design");
  const [admin, setAdmin] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showStaffManagement, setShowStaffManagement] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [ordersDesign, setOrdersDesign] = useState<any[]>([]);
  const [ordersVideo, setOrdersVideo] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingScroll, setPendingScroll] = useState<{ orderId?: number; type: 'design' | 'video'; name?: string } | null>(null);
  const didInitNotifications = useRef(false);
  const prevUnreadCountRef = useRef(0);

  // Fetch orders từ server (cả 2 trình duyệt đều đọc từ cùng 1 nơi)
  async function fetchOrders() {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) return;
      const data = await res.json();
      setOrdersDesign(data.ordersDesign || []);
      setOrdersVideo(data.ordersVideo || []);
      setNotifications(data.notifications || []);
    } catch {}
  }

  // Fetch ngay khi load trang
  useEffect(() => {
    fetchOrders();

    const eventSource = new EventSource('/api/orders-stream');
    const onOrdersUpdated = () => {
      fetchOrders();
    };

    eventSource.addEventListener('orders-updated', onOrdersUpdated as EventListener);
    eventSource.onerror = () => {
      // Khi mạng chập chờn, EventSource tự reconnect.
    };

    return () => {
      eventSource.removeEventListener('orders-updated', onOrdersUpdated as EventListener);
      eventSource.close();
    };
  }, []);

  // Phát âm thanh khi có thông báo mới dành cho role hiện tại (không chạy ở lần load đầu).
  function isNotifForMe(n: any) {
    const role = admin?.role || 'user';
    if (role === 'user') return !n.forRole || n.forRole === 'user';
    if (role === 'admin') return n.forRole === 'admin';
    // design/video staff: chỉ nhận thông báo có forType khớp chính xác
    return n.forRole === 'admin' && n.forType === role;
  }

  useEffect(() => {
    const unreadCount = notifications.filter((n: any) => !n.read && isNotifForMe(n)).length;

    if (!didInitNotifications.current) {
      didInitNotifications.current = true;
      prevUnreadCountRef.current = unreadCount;
      return;
    }

    if (unreadCount > prevUnreadCountRef.current) {
      try {
        const audio = new Audio('/thongbao.mp3');
        audio.play();
      } catch {}
    }

    prevUnreadCountRef.current = unreadCount;
  }, [notifications, admin]);

  // Sau khi bấm thông báo, chỉ cuộn khi tab + danh sách đã render xong.
  useEffect(() => {
    if (!pendingScroll) return;

    const targetTab = pendingScroll.type === 'design' ? 'order-design' : 'order-video';
    if (activeTab !== targetTab) return;

    const byId = pendingScroll.orderId ? document.getElementById(`order-${pendingScroll.orderId}`) : null;
    const byTitle = !byId && pendingScroll.name
      ? document.querySelector(`[data-order-title="${pendingScroll.name.toLowerCase().replace(/"/g, '\\"')}"]`)
      : null;

    const target = byId || byTitle;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setPendingScroll(null);
    }
  }, [pendingScroll, activeTab, ordersDesign, ordersVideo]);

  // Hàm thêm order mới - lưu lên server
  async function addOrder(type: 'design' | 'video', order: {
    id?: number;
    title: string;
    status: string;
    deadline: string;
    size: string;
    version: string;
    content: string;
    [key: string]: any;
  }) {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newOrder = { ...order, id: Date.now() };
    const notification = {
      id: Date.now() + 1,
      type,
      orderId: newOrder.id,
      name: order.title || (type === 'design' ? 'Order Design' : 'Order Video'),
      time,
      read: false,
      forRole: 'admin',
      forType: type
    };
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, order: newOrder, notification })
      });
      // Cập nhật state ngay lập tức (không cần chờ poll)
      if (type === 'design') {
        setOrdersDesign(prev => [newOrder, ...prev]);
      } else {
        setOrdersVideo(prev => [newOrder, ...prev]);
      }
      setNotifications(prev => [notification, ...prev]);
    } catch {}
  }

  async function handleReceiveOrder(type: 'design' | 'video', orderId: number) {
    const receivedBy = admin?.displayName || admin?.username || '';
    if (type === 'design') {
      setOrdersDesign(prev => prev.map((o: any) => (o.id === orderId ? { ...o, status: 'Đã nhận', receivedBy } : o)));
    } else {
      setOrdersVideo(prev => prev.map((o: any) => (o.id === orderId ? { ...o, status: 'Đã nhận', receivedBy } : o)));
    }

    fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'receive', type, orderId, receivedBy })
    }).catch(() => {
      fetchOrders();
    });
  }

  async function handleDeleteOrder(type: 'design' | 'video', orderId: number) {
    await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', type, orderId })
    });
    fetchOrders();
  }

  async function handleSubmitFinal(type: 'design' | 'video', orderId: number, finalLink: string) {
    if (!finalLink) return;

    if (type === 'design') {
      setOrdersDesign(prev => prev.map((o: any) => (o.id === orderId ? { ...o, status: 'Hoàn thành', finalLink } : o)));
    } else {
      setOrdersVideo(prev => prev.map((o: any) => (o.id === orderId ? { ...o, status: 'Hoàn thành', finalLink } : o)));
    }

    fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deliver', type, orderId, finalLink })
    }).catch(() => {
      fetchOrders();
    });
  }

  async function handleRequestRevision(type: 'design' | 'video', orderId: number, note: string) {
    if (!note) return;

    if (type === 'design') {
      setOrdersDesign(prev => prev.map((o: any) => (o.id === orderId ? { ...o, status: 'Cần sửa', revisionNote: note } : o)));
    } else {
      setOrdersVideo(prev => prev.map((o: any) => (o.id === orderId ? { ...o, status: 'Cần sửa', revisionNote: note } : o)));
    }

    fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request-revision', type, orderId, note })
    }).catch(() => {
      fetchOrders();
    });
  }

  async function handleApproveOrder(type: 'design' | 'video', orderId: number) {
    if (type === 'design') {
      setOrdersDesign(prev => prev.map((o: any) => (o.id === orderId ? { ...o, status: 'Đã duyệt' } : o)));
    } else {
      setOrdersVideo(prev => prev.map((o: any) => (o.id === orderId ? { ...o, status: 'Đã duyệt' } : o)));
    }

    fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', type, orderId })
    }).catch(() => {
      fetchOrders();
    });
  }

  function handleLogout() {
    setAdmin(null);
  }

  function renderTabContent() {
    switch (activeTab) {
      case "order-design":
        return (
          <>
            <div className="mb-8 w-full">
              <h2 className="text-xl font-bold text-[#D81B60] mb-4">Form order Design</h2>
              <p className="text-gray-500 mb-4">Bố cục riêng cho design, tách khỏi form Video</p>
              <div className="bg-[#FDF2F5] rounded-xl p-6 w-full">
                <Suspense fallback={<div>Đang tải form...</div>}>
                  <OrderDesignForm onCreate={order => addOrder('design', order)} />
                </Suspense>
              </div>
            </div>
          </>
        );
      case "order-video":
        return (
          <>
            <div className="mb-8 w-full">
              <h2 className="text-xl font-bold text-[#D81B60] mb-4">Form order Video</h2>
              <p className="text-gray-500 mb-4">Bố cục riêng cho video, tách khỏi form Design</p>
              <div className="bg-[#FDF2F5] rounded-xl p-6 w-full">
                <Suspense fallback={<div>Đang tải form...</div>}>
                  <OrderVideoForm onCreate={order => addOrder('video', order)} />
                </Suspense>
              </div>
            </div>
          </>
        );
      default:
        return <div>Chọn chức năng để bắt đầu sử dụng hệ thống Nora Care.</div>;
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF2F5] flex flex-col">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onShowLogin={() => setShowLogin(true)}
        admin={admin}
        onLogout={handleLogout}
        onShowCreateUser={() => setShowCreateUser(true)}
        onShowStaffManagement={() => setShowStaffManagement(true)}
        onShowNotification={() => setShowNotification(true)}
        notificationCount={notifications.filter((n: any) => !n.read && isNotifForMe(n)).length}
      />
      <main className="flex-1 w-full px-0 py-6">
        <div className="bg-white rounded-xl shadow p-2 md:p-6 w-full">
          {renderTabContent()}
        </div>
        {/* Dashboard tách biệt phía dưới */}
        <section>
          {(() => {
            const currentType = activeTab === "order-design" ? "design" : "video";
            // Staff chỉ thấy dashboard đúng role của mình
            if (admin && admin.role !== 'admin' && admin.role !== currentType) return null;
            // isAdmin (có quyền Nhận/Xóa) khi là admin hoặc đúng role dashboard đang xem
            const canAct = !admin ? false : (admin.role === 'admin' || admin.role === currentType);
            return (
              <Dashboard
                type={currentType}
                orders={currentType === "design" ? ordersDesign : ordersVideo}
                isAdmin={canAct}
                onReceiveOrder={(id) => handleReceiveOrder(currentType, id)}
                onDeleteOrder={(id) => handleDeleteOrder(currentType, id)}
                onSubmitFinal={(id, finalLink) => handleSubmitFinal(currentType, id, finalLink)}
                onRequestRevision={(id, note) => handleRequestRevision(currentType, id, note)}
                onApproveOrder={(id) => handleApproveOrder(currentType, id)}
              />
            );
          })()}
        </section>
      </main>
      {showLogin && (
        <div className="fixed inset-0 bg-[rgba(255,255,255,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative">
            <button className="absolute top-2 right-2 text-xl text-gray-500 hover:text-pink-600" onClick={() => setShowLogin(false)}>&times;</button>
            <AdminLogin onLogin={user => {
              setAdmin(user);
              setShowLogin(false);
              // Auto-switch tab theo role
              if (user.role === 'design') setActiveTab('order-design');
              else if (user.role === 'video') setActiveTab('order-video');
            }} />
          </div>
        </div>
      )}
      {showCreateUser && (
        <CreateUserPopup onClose={() => setShowCreateUser(false)} onCreated={() => {}} />
      )}
      {showStaffManagement && (
        <StaffManagement onClose={() => setShowStaffManagement(false)} />
      )}
      {admin && showNotification && (
        <NotificationPopup
          notifications={notifications.filter((n: any) => isNotifForMe(n))}
          onClose={() => setShowNotification(false)}
          onClickNotification={async n => {
            fetch('/api/orders', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'mark-read', notificationId: n.id })
            }).catch(() => {});
            setNotifications(notifications.map((x: any) => x.id === n.id ? { ...x, read: true } : x));
            setShowNotification(false);
            // Chỉ chuyển tab nếu role có quyền xem dashboard đó
            const role = admin?.role || 'admin';
            const canViewDesign = role === 'admin' || role === 'design';
            const canViewVideo = role === 'admin' || role === 'video';
            if (n.type === 'design' && canViewDesign) {
              setActiveTab('order-design');
              setPendingScroll({ orderId: n.orderId, type: n.type, name: n.name });
            } else if (n.type === 'video' && canViewVideo) {
              setActiveTab('order-video');
              setPendingScroll({ orderId: n.orderId, type: n.type, name: n.name });
            }
          }}
        />
      )}
    </div>
  );
}
