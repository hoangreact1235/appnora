import React from "react";

interface Notification {
  id: number;
  type: string;
  name: string;
  time: string;
  read: boolean;
}

interface NotificationPopupProps {
  notifications: Notification[];
  onClose: () => void;
  onClickNotification: (n: Notification) => void;
}

export default function NotificationPopup({ notifications, onClose, onClickNotification }: NotificationPopupProps) {
  return (
    <div className="fixed top-8 right-8 z-50">
      <div className="relative bg-white rounded-2xl shadow p-4 w-[350px]">
        <button className="absolute top-2 right-2 text-xl text-gray-500 hover:text-pink-600" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-bold text-pink-600 mb-3">Thông báo mới</h2>
        {notifications.length === 0 ? (
          <div className="text-gray-400 text-center py-8">Không có thông báo mới</div>
        ) : (
          <ul className="flex flex-col gap-2 max-h-[350px] overflow-y-auto">
            {notifications.map((n, idx) => (
              <li key={n.id} className={`rounded-lg px-3 py-2 cursor-pointer border border-pink-100 hover:bg-pink-50 transition ${n.read ? 'opacity-60' : 'bg-pink-50'}`} onClick={() => onClickNotification(n)}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#D81B60]">{n.type === 'design' ? 'Order Design' : 'Order Video'}</span>
                  <span className="text-xs text-gray-400">{n.time}</span>
                </div>
                <div className="text-sm text-[#6B184E]">{n.name}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
