import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { ordersEmitter } from '../../lib/ordersEvents';

const ORDERS_FILE = path.join(process.cwd(), 'orders-data.json');

function readData() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) {
      const empty = { ordersDesign: [], ordersVideo: [], notifications: [] };
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(empty));
      return empty;
    }
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch {
    return { ordersDesign: [], ordersVideo: [], notifications: [] };
  }
}

function writeData(data: any) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2));
}

function bumpVersion(version?: string) {
  const current = Number(String(version || 'V0').replace(/[^0-9]/g, '')) || 0;
  return `V${current + 1}`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const data = readData();
    // Strip ordererToken before returning to clients
    const sanitized = {
      ...data,
      ordersDesign: (data.ordersDesign || []).map(({ ordererToken: _t, ...o }: any) => o),
      ordersVideo: (data.ordersVideo || []).map(({ ordererToken: _t, ...o }: any) => o),
    };
    return res.json(sanitized);
  }

  if (req.method === 'POST') {
    const { type, order, notification } = req.body;
    const data = readData();
    const preparedOrder = {
      ...order,
      createdAt: order?.createdAt || new Date().toISOString()
    };
    if (type === 'design') {
      data.ordersDesign = [preparedOrder, ...data.ordersDesign];
    } else {
      data.ordersVideo = [preparedOrder, ...data.ordersVideo];
    }
    if (notification) {
      data.notifications = [notification, ...data.notifications];
    }
    writeData(data);
    ordersEmitter.emit('orders-updated');
    return res.json({ success: true });
  }

  if (req.method === 'PATCH') {
    const { action, notificationId, type, orderId, finalLink, receivedBy } = req.body;
    const data = readData();

    if (action === 'mark-read') {
      data.notifications = data.notifications.map((n: any) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
    }

    if (action === 'receive') {
      const targetOrdersR = type === 'design' ? data.ordersDesign : data.ordersVideo;
      const receivedOrder = targetOrdersR.find((o: any) => o.id === orderId);
      if (type === 'design') {
        data.ordersDesign = data.ordersDesign.map((o: any) =>
          o.id === orderId ? { ...o, status: 'Đã nhận', receivedBy: receivedBy || '', receivedAt: o.receivedAt || new Date().toISOString() } : o
        );
      } else {
        data.ordersVideo = data.ordersVideo.map((o: any) =>
          o.id === orderId ? { ...o, status: 'Đã nhận', receivedBy: receivedBy || '', receivedAt: o.receivedAt || new Date().toISOString() } : o
        );
      }
      if (receivedOrder) {
        data.notifications = [
          {
            id: Date.now() + 1,
            type,
            orderId,
            name: `${receivedOrder.title} - Đã được nhận`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            forRole: 'user',
            forType: type
          },
          ...data.notifications
        ];
      }
    }

    if (action === 'deliver') {
      const targetOrdersD = type === 'design' ? data.ordersDesign : data.ordersVideo;
      const deliveredOrder = targetOrdersD.find((o: any) => o.id === orderId);
      if (type === 'design') {
        data.ordersDesign = data.ordersDesign.map((o: any) =>
          o.id === orderId ? { ...o, status: 'Hoàn thành', finalLink, version: bumpVersion(o.version), revisionNote: '', completedAt: new Date().toISOString() } : o
        );
      } else {
        data.ordersVideo = data.ordersVideo.map((o: any) =>
          o.id === orderId ? { ...o, status: 'Hoàn thành', finalLink, version: bumpVersion(o.version), revisionNote: '', completedAt: new Date().toISOString() } : o
        );
      }
      if (deliveredOrder) {
        data.notifications = [
          {
            id: Date.now() + 1,
            type,
            orderId,
            name: `${deliveredOrder.title} - Final link đã sẵn sàng`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            forRole: 'user',
            forType: type
          },
          ...data.notifications
        ];
      }
    }

    if (action === 'request-revision') {
      const note = String(req.body.note || '').trim();
      const clientToken = String(req.body.ordererToken || '');
      const targetOrders = type === 'design' ? data.ordersDesign : data.ordersVideo;
      const target = targetOrders.find((o: any) => o.id === orderId);

      if (!target) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Validate token if order has one
      if (target.ordererToken && target.ordererToken !== clientToken) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const updatedOrder = { ...target, status: 'Cần sửa', revisionNote: note };
      if (type === 'design') {
        data.ordersDesign = data.ordersDesign.map((o: any) => (o.id === orderId ? updatedOrder : o));
      } else {
        data.ordersVideo = data.ordersVideo.map((o: any) => (o.id === orderId ? updatedOrder : o));
      }

      data.notifications = [
        {
          id: Date.now() + 2,
          type,
          orderId,
          name: `${target.title} - Yêu cầu sửa: ${note || 'Cần chỉnh sửa bản final'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
          forRole: 'admin',
          forType: type
        },
        ...data.notifications
      ];
    }

    if (action === 'approve') {
      const clientToken = String(req.body.ordererToken || '');
      const targetOrders = type === 'design' ? data.ordersDesign : data.ordersVideo;
      const target = targetOrders.find((o: any) => o.id === orderId);

      if (!target) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Validate token if order has one
      if (target.ordererToken && target.ordererToken !== clientToken) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const approvedOrder = { ...target, status: 'Đã duyệt' };
      if (type === 'design') {
        data.ordersDesign = data.ordersDesign.map((o: any) => (o.id === orderId ? approvedOrder : o));
      } else {
        data.ordersVideo = data.ordersVideo.map((o: any) => (o.id === orderId ? approvedOrder : o));
      }

      data.notifications = [
        {
          id: Date.now() + 3,
          type,
          orderId,
          name: `${target.title} - Người order đã xác nhận hoàn thành`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
          forRole: 'admin',
          forType: type
        },
        ...data.notifications
      ];
    }

    if (action === 'delete') {
      if (type === 'design') {
        data.ordersDesign = data.ordersDesign.filter((o: any) => o.id !== orderId);
      } else {
        data.ordersVideo = data.ordersVideo.filter((o: any) => o.id !== orderId);
      }
      data.notifications = data.notifications.filter((n: any) => n.orderId !== orderId);
    }

    if (action === 'clear-notifications') {
      // Xóa tất cả notifications cũ không có forType (chỉ giữ notifications mới có đầy đủ thông tin)
      data.notifications = data.notifications.filter((n: any) => n.forType && n.forRole);
    }

    writeData(data);
    ordersEmitter.emit('orders-updated');
    return res.json({ success: true });
  }

  res.status(405).json({ message: 'Method not allowed' });
}
