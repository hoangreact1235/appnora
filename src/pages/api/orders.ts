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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const data = readData();
    return res.json(data);
  }

  if (req.method === 'POST') {
    const { type, order, notification } = req.body;
    const data = readData();
    if (type === 'design') {
      data.ordersDesign = [order, ...data.ordersDesign];
    } else {
      data.ordersVideo = [order, ...data.ordersVideo];
    }
    if (notification) {
      data.notifications = [notification, ...data.notifications];
    }
    writeData(data);
    ordersEmitter.emit('orders-updated');
    return res.json({ success: true });
  }

  if (req.method === 'PATCH') {
    const { action, notificationId, type, orderId } = req.body;
    const data = readData();

    if (action === 'mark-read') {
      data.notifications = data.notifications.map((n: any) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
    }

    if (action === 'receive') {
      if (type === 'design') {
        data.ordersDesign = data.ordersDesign.map((o: any) =>
          o.id === orderId ? { ...o, status: 'Đã nhận' } : o
        );
      } else {
        data.ordersVideo = data.ordersVideo.map((o: any) =>
          o.id === orderId ? { ...o, status: 'Đã nhận' } : o
        );
      }
    }

    if (action === 'delete') {
      if (type === 'design') {
        data.ordersDesign = data.ordersDesign.filter((o: any) => o.id !== orderId);
      } else {
        data.ordersVideo = data.ordersVideo.filter((o: any) => o.id !== orderId);
      }
      data.notifications = data.notifications.filter((n: any) => n.orderId !== orderId);
    }

    writeData(data);
    ordersEmitter.emit('orders-updated');
    return res.json({ success: true });
  }

  res.status(405).json({ message: 'Method not allowed' });
}
