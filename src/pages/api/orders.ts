import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

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
    return res.json({ success: true });
  }

  if (req.method === 'PATCH') {
    // Đánh dấu thông báo đã đọc
    const { notificationId } = req.body;
    const data = readData();
    data.notifications = data.notifications.map((n: any) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    writeData(data);
    return res.json({ success: true });
  }

  res.status(405).json({ message: 'Method not allowed' });
}
