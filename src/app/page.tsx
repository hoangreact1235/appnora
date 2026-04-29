"use client";
import React, { useState, useEffect, Suspense } from "react";
import Header from "./components/Header";
import AdminLogin from "./components/AdminLogin";
import OrderDesignForm from "./components/OrderDesignForm";
import OrderDesignHistory from "./components/OrderDesignHistory";
import OrderVideoForm from "./components/OrderVideoForm";
import OrderVideoHistory from "./components/OrderVideoHistory";
import Dashboard from "./components/Dashboard";

import CreateUserPopup from "./components/CreateUserPopup";
import NotificationPopup from "./components/NotificationPopup";
export default function Home() {
  const [activeTab, setActiveTab] = useState("order-design");
  const [admin, setAdmin] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  // State orders và notifications
  const [ordersDesign, setOrdersDesign] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ordersDesign') || '[]');
    } catch { return []; }
  });
  const [ordersVideo, setOrdersVideo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ordersVideo') || '[]');
    } catch { return []; }
  });
  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('notifications') || '[]');
    } catch { return []; }
  });

  // Lắng nghe sự kiện storage để đồng bộ giữa các tab
  useEffect(() => {
    function syncFromStorage(e: StorageEvent) {
      if (e.key === 'ordersDesign') setOrdersDesign(JSON.parse(e.newValue || '[]'));
      if (e.key === 'ordersVideo') setOrdersVideo(JSON.parse(e.newValue || '[]'));
      if (e.key === 'notifications') setNotifications(JSON.parse(e.newValue || '[]'));
    }
    window.addEventListener('storage', syncFromStorage);
    return () => window.removeEventListener('storage', syncFromStorage);
  }, []);

  // Hàm thêm order mới
  function addOrder(type: 'design' | 'video', order: {
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
    let updatedOrders;
    try {
      if (type === 'design') {
        updatedOrders = [{ ...order, id: Date.now() }, ...ordersDesign];
        localStorage.setItem('ordersDesign', JSON.stringify(updatedOrders));
        setOrdersDesign(updatedOrders);
      } else {
        updatedOrders = [{ ...order, id: Date.now() }, ...ordersVideo];
        localStorage.setItem('ordersVideo', JSON.stringify(updatedOrders));
        setOrdersVideo(updatedOrders);
      }
      // Thông báo
      const updatedNotifications = [
        {
          id: Date.now(),
          type,
          name: order.title || (type === 'design' ? 'Order Design' : 'Order Video'),
          time,
          read: false
        },
        ...notifications
      ];
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
    } catch (err) {
      setOrdersDesign([]);
      setOrdersVideo([]);
      setNotifications([]);
    }
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
        onShowNotification={() => setShowNotification(true)}
        notificationCount={notifications.filter((n: { read: boolean }) => !n.read).length}
      />
      <main className="flex-1 w-full px-0 py-6">
        <div className="bg-white rounded-xl shadow p-2 md:p-6 w-full">
          {renderTabContent()}
        </div>
        {/* Dashboard tách biệt phía dưới */}
        <section>
          <Dashboard
            type={activeTab === "order-design" ? "design" : "video"}
            orders={activeTab === "order-design" ? ordersDesign : ordersVideo}
          />
        </section>
      </main>
      {showLogin && (
        <div className="fixed inset-0 bg-[rgba(255,255,255,0.5)] backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative">
            <button className="absolute top-2 right-2 text-xl text-gray-500 hover:text-pink-600" onClick={() => setShowLogin(false)}>&times;</button>
            <AdminLogin onLogin={user => { setAdmin(user); setShowLogin(false); }} />
          </div>
        </div>
      )}
      {showCreateUser && (
        <CreateUserPopup onClose={() => setShowCreateUser(false)} onCreated={() => {}} />
      )}
      {admin && showNotification && (
        <NotificationPopup
          notifications={notifications}
          onClose={() => setShowNotification(false)}
          onClickNotification={n => {
            setNotifications(notifications.map((x: { id: number; read: boolean }) => x.id === n.id ? { ...x, read: true } : x));
            setShowNotification(false);
            // TODO: scroll tới order tương ứng
          }}
        />
      )}
    </div>
  );
}
