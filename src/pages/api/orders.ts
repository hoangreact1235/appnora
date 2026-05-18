import type { NextApiRequest, NextApiResponse } from 'next';
import { ordersEmitter } from '../../lib/ordersEvents';
import { redisGet, redisSet } from '../../lib/redis';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

const ORDERS_KEY = 'nora_orders_data';
const DELETED_RETENTION_DAYS = 60;
const AUDIT_RETENTION_DAYS = 180;

type Actor = {
  username?: string;
  displayName?: string;
  role: 'admin' | 'design' | 'video' | 'user';
  name: string;
};

function normalizeRole(role: any): Actor['role'] {
  if (role === 'admin' || role === 'design' || role === 'video') return role;
  return 'user';
}

function getActor(req: NextApiRequest): Actor {
  const raw = req.body?.actor || {};
  const role = normalizeRole(raw?.role);
  const username = typeof raw?.username === 'string' ? raw.username : '';
  const displayName = typeof raw?.displayName === 'string' ? raw.displayName : '';
  const name = displayName || username || (role === 'admin' ? 'Admin' : role === 'user' ? 'Người dùng' : role);
  return {
    username,
    displayName,
    role,
    name,
  };
}

function normalizeData(raw: any) {
  return {
    ordersDesign: Array.isArray(raw?.ordersDesign) ? raw.ordersDesign : [],
    ordersVideo: Array.isArray(raw?.ordersVideo) ? raw.ordersVideo : [],
    notifications: Array.isArray(raw?.notifications) ? raw.notifications : [],
    deletedOrders: Array.isArray(raw?.deletedOrders) ? raw.deletedOrders : [],
    orderAuditLogs: Array.isArray(raw?.orderAuditLogs) ? raw.orderAuditLogs : [],
  };
}

function applyRetention(data: any) {
  const now = Date.now();
  const deletedCutoff = now - DELETED_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const auditCutoff = now - AUDIT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  data.deletedOrders = (data.deletedOrders || []).filter((o: any) => {
    const deletedAtMs = new Date(o?.deletedAt || 0).getTime();
    return Number.isFinite(deletedAtMs) && deletedAtMs >= deletedCutoff;
  });

  data.orderAuditLogs = (data.orderAuditLogs || []).filter((l: any) => {
    const createdAtMs = new Date(l?.createdAt || 0).getTime();
    return Number.isFinite(createdAtMs) && createdAtMs >= auditCutoff;
  });

  return data;
}

function pushAudit(data: any, payload: any) {
  data.orderAuditLogs = [
    {
      id: Date.now() + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      ...payload,
    },
    ...(data.orderAuditLogs || []),
  ].slice(0, 1000);
}

function stripToken(list: any[]) {
  return (list || []).map(({ ordererToken: _t, ...rest }: any) => rest);
}

function sanitizeOrderForList(order: any) {
  const attachments = Array.isArray(order?.attachments)
    ? order.attachments.map((att: any, index: number) => {
        const isLargeInline = typeof att?.url === 'string' && att.url.startsWith('data:');
        if (!isLargeInline) return att;
        return {
          ...att,
          url: undefined,
          attachmentIndex: index,
          hasInlineData: true,
        };
      })
    : undefined;

  return {
    ...order,
    attachments,
  };
}

function sanitizeOrdersForList(list: any[]) {
  return (list || []).map((order: any) => sanitizeOrderForList(order));
}

function isAdminActor(actor: Actor) {
  return actor.role === 'admin';
}

function canManageType(actor: Actor, type: any) {
  if (actor.role === 'admin') return true;
  if (actor.role === 'design' || actor.role === 'video') return actor.role === type;
  return false;
}

function isValidType(type: any): type is 'design' | 'video' {
  return type === 'design' || type === 'video';
}

function queryFlag(value: any, defaultValue: boolean) {
  if (value === undefined) return defaultValue;
  return String(value) === '1' || String(value).toLowerCase() === 'true';
}

async function readData() {
  const raw = await redisGet(ORDERS_KEY);
  if (!raw) {
    return { ordersDesign: [], ordersVideo: [], notifications: [], deletedOrders: [], orderAuditLogs: [] };
  }

  return applyRetention(normalizeData(JSON.parse(raw)));
}

async function writeData(data: any) {
  const normalized = applyRetention(normalizeData(data));
  await redisSet(ORDERS_KEY, JSON.stringify(normalized));
}

function bumpVersion(version?: string) {
  const current = Number(String(version || 'V0').replace(/[^0-9]/g, '')) || 0;
  return `V${current + 1}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      if (req.query.action === 'attachment') {
        const type = req.query.type;
        const orderId = Number(req.query.orderId);
        const index = Number(req.query.index);

        if (!isValidType(type)) {
          return res.status(400).json({ message: 'Invalid order type' });
        }
        if (!Number.isFinite(orderId) || !Number.isFinite(index) || index < 0) {
          return res.status(400).json({ message: 'Invalid attachment query' });
        }

        const data = await readData();
        const list = type === 'design' ? data.ordersDesign : data.ordersVideo;
        const target = (list || []).find((o: any) => o.id === orderId);
        if (!target) {
          return res.status(404).json({ message: 'Order not found' });
        }

        const att = Array.isArray(target.attachments) ? target.attachments[index] : undefined;
        if (!att?.url) {
          return res.status(404).json({ message: 'Attachment not found' });
        }

        return res.json({
          url: att.url,
          name: att.name,
          type: att.type,
        });
      }

      const data = await readData();
      const actorRole = normalizeRole(req.query.actorRole);
      // Include flags + pagination params
      const includeDesign = queryFlag(req.query.includeDesign, true);
      const includeVideo = queryFlag(req.query.includeVideo, true);
      const includeDeleted = queryFlag(req.query.includeDeleted, actorRole === 'admin');
      const includeAudit = queryFlag(req.query.includeAudit, actorRole === 'admin');
      const odOffset = Number(req.query.odOffset) || 0;
      const odLimit = Math.max(1, Math.min(Number(req.query.odLimit) || 100, 200));
      const ovOffset = Number(req.query.ovOffset) || 0;
      const ovLimit = Math.max(1, Math.min(Number(req.query.ovLimit) || 100, 200));
      const delOffset = Number(req.query.delOffset) || 0;
      const delLimit = Math.max(1, Math.min(Number(req.query.delLimit) || 50, 200));
      const auditOffset = Number(req.query.auditOffset) || 0;
      const auditLimit = Math.max(1, Math.min(Number(req.query.auditLimit) || 50, 200));
      const notifOffset = Number(req.query.notifOffset) || 0;
      const notifLimit = Math.max(1, Math.min(Number(req.query.notifLimit) || 200, 500));

      const payload: any = {
        notifications: (data.notifications || []).slice(notifOffset, notifOffset + notifLimit),
      };

      if (includeDesign) {
        payload.ordersDesign = sanitizeOrdersForList(stripToken((data.ordersDesign || []).slice(odOffset, odOffset + odLimit)));
      }
      if (includeVideo) {
        payload.ordersVideo = sanitizeOrdersForList(stripToken((data.ordersVideo || []).slice(ovOffset, ovOffset + ovLimit)));
      }
      if (includeDeleted && actorRole === 'admin') {
        payload.deletedOrders = sanitizeOrdersForList(stripToken((data.deletedOrders || []).slice(delOffset, delOffset + delLimit)));
      }
      if (includeAudit && actorRole === 'admin') {
        payload.orderAuditLogs = (data.orderAuditLogs || []).slice(auditOffset, auditOffset + auditLimit);
      }

      return res.json(payload);
    }

    if (req.method === 'POST') {
      const { type, order, notification } = req.body;
      if (type !== 'design' && type !== 'video') {
        return res.status(400).json({ message: 'Invalid order type' });
      }
      const data = await readData();
      const preparedOrder = {
        ...order,
        isDeleted: false,
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
      pushAudit(data, {
        action: 'create',
        type,
        orderId: preparedOrder.id,
        title: preparedOrder.title,
        by: 'user',
        byRole: 'user',
      });
      await writeData(data);
      ordersEmitter.emit('orders-updated');
      return res.json({ success: true });
    }

    if (req.method === 'PATCH') {
      const { action, notificationId, type, orderId, finalLink, receivedBy } = req.body;
      const data = await readData();
      const actor = getActor(req);

    if (action === 'mark-read') {
      data.notifications = data.notifications.map((n: any) =>
        n.id === notificationId ? { ...n, read: true } : n
      );
    }

    if (action === 'receive') {
      if (!isValidType(type)) {
        return res.status(400).json({ message: 'Invalid order type' });
      }
      if (!canManageType(actor, type)) {
        return res.status(403).json({ message: 'No permission to receive this order type' });
      }
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
        pushAudit(data, {
          action: 'receive',
          type,
          orderId,
          title: receivedOrder.title,
          by: actor.name,
          byRole: actor.role,
        });
        data.notifications = [
          {
            id: Date.now() + 1,
            type,
            orderId,
            ordererToken: receivedOrder.ordererToken || '',
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
      if (!isValidType(type)) {
        return res.status(400).json({ message: 'Invalid order type' });
      }
      if (!canManageType(actor, type)) {
        return res.status(403).json({ message: 'No permission to deliver this order type' });
      }
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
        pushAudit(data, {
          action: 'deliver',
          type,
          orderId,
          title: deliveredOrder.title,
          by: actor.name,
          byRole: actor.role,
        });
        data.notifications = [
          {
            id: Date.now() + 1,
            type,
            orderId,
            ordererToken: deliveredOrder.ordererToken || '',
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
      if (!isValidType(type)) {
        return res.status(400).json({ message: 'Invalid order type' });
      }
      if (actor.role !== 'user') {
        return res.status(403).json({ message: 'Only orderer can request revision' });
      }
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

      pushAudit(data, {
        action: 'request-revision',
        type,
        orderId,
        title: target.title,
        by: actor.name,
        byRole: actor.role,
        note,
      });

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
      if (!isValidType(type)) {
        return res.status(400).json({ message: 'Invalid order type' });
      }
      if (actor.role !== 'user') {
        return res.status(403).json({ message: 'Only orderer can approve completion' });
      }
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

      pushAudit(data, {
        action: 'approve',
        type,
        orderId,
        title: target.title,
        by: actor.name,
        byRole: actor.role,
      });

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
      if (!isValidType(type)) {
        return res.status(400).json({ message: 'Invalid order type' });
      }
      if (!canManageType(actor, type)) {
        return res.status(403).json({ message: 'No permission to delete this order type' });
      }
      const targetOrders = type === 'design' ? data.ordersDesign : data.ordersVideo;
      const target = targetOrders.find((o: any) => o.id === orderId);
      if (!target) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const deletedOrder = {
        ...target,
        type,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: actor.name,
        deletedByUsername: actor.username || '',
        deletedByRole: actor.role,
        deletedReason: String(req.body?.deleteReason || '').trim(),
      };

      if (type === 'design') {
        data.ordersDesign = data.ordersDesign.filter((o: any) => o.id !== orderId);
      } else {
        data.ordersVideo = data.ordersVideo.filter((o: any) => o.id !== orderId);
      }

      data.deletedOrders = [deletedOrder, ...(data.deletedOrders || [])];
      data.notifications = data.notifications.filter((n: any) => n.orderId !== orderId);

      pushAudit(data, {
        action: 'soft-delete',
        type,
        orderId,
        title: target.title,
        by: actor.name,
        byRole: actor.role,
      });

      if (!isAdminActor(actor)) {
        data.notifications = [
          {
            id: Date.now() + 10,
            type,
            orderId,
            name: `${target.title} - Đã bị xóa bởi ${actor.name}`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            forRole: 'admin',
            forType: type,
          },
          ...data.notifications,
        ];
      }
    }

    if (action === 'restore') {
      if (!isValidType(type)) {
        return res.status(400).json({ message: 'Invalid order type' });
      }
      if (!isAdminActor(actor)) {
        return res.status(403).json({ message: 'Only admin can restore orders' });
      }
      const deletedIndex = (data.deletedOrders || []).findIndex((o: any) => o.id === orderId && (o.type || type) === type);
      if (deletedIndex < 0) {
        return res.status(404).json({ message: 'Deleted order not found' });
      }

      const deletedOrder = data.deletedOrders[deletedIndex];
      data.deletedOrders.splice(deletedIndex, 1);

      const {
        isDeleted,
        deletedAt,
        deletedBy,
        deletedByUsername,
        deletedByRole,
        deletedReason,
        ...restoredBase
      } = deletedOrder;

      const restoredOrder = {
        ...restoredBase,
        restoredAt: new Date().toISOString(),
        restoredBy: actor.name,
        restoredByUsername: actor.username || '',
      };

      if (type === 'design') {
        data.ordersDesign = [restoredOrder, ...data.ordersDesign];
      } else {
        data.ordersVideo = [restoredOrder, ...data.ordersVideo];
      }

      pushAudit(data, {
        action: 'restore',
        type,
        orderId,
        title: restoredOrder.title,
        by: actor.name,
        byRole: actor.role,
      });
    }

    if (action === 'permanent-delete') {
      if (!isValidType(type)) {
        return res.status(400).json({ message: 'Invalid order type' });
      }
      if (!isAdminActor(actor)) {
        return res.status(403).json({ message: 'Only admin can permanently delete orders' });
      }
      const deletedIndex = (data.deletedOrders || []).findIndex((o: any) => o.id === orderId && (o.type || type) === type);
      if (deletedIndex < 0) {
        return res.status(404).json({ message: 'Deleted order not found' });
      }

      const deletedOrder = data.deletedOrders[deletedIndex];
      data.deletedOrders.splice(deletedIndex, 1);
      data.notifications = data.notifications.filter((n: any) => n.orderId !== orderId);

      pushAudit(data, {
        action: 'permanent-delete',
        type,
        orderId,
        title: deletedOrder?.title || `Order #${orderId}`,
        by: actor.name,
        byRole: actor.role,
      });
    }

    if (action === 'clear-notifications') {
      // Xóa tất cả notifications cũ không có forType (chỉ giữ notifications mới có đầy đủ thông tin)
      data.notifications = data.notifications.filter((n: any) => n.forType && n.forRole);
    }

      await writeData(data);
      ordersEmitter.emit('orders-updated');
      return res.json({ success: true });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('orders api storage error', error);
    return res.status(500).json({ message: 'Không thể đọc hoặc lưu order lúc này.' });
  }
}
