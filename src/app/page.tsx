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
  const [ordersDesign, setOrdersDesign] = useState<any[]>([]);
  const [ordersVideo, setOrdersVideo] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

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

  // Fetch ngay khi load trang, sau đó poll mỗi 5 giây
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

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
      name: order.title || (type === 'design' ? 'Order Design' : 'Order Video'),
      time,
      read: false
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
            isAdmin={!!admin}
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
          onClickNotification={async n => {
            await fetch('/api/orders', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ notificationId: n.id })
            });
            setNotifications(notifications.map((x: any) => x.id === n.id ? { ...x, read: true } : x));
            setShowNotification(false);
          }}
        />
      )}
    </div>
  );
}
