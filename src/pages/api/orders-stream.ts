import type { NextApiRequest, NextApiResponse } from 'next';
import { ordersEmitter } from '../../lib/ordersEvents';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  const onOrdersUpdated = () => {
    res.write(`event: orders-updated\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
  };

  const keepAlive = setInterval(() => {
    res.write(`event: ping\ndata: ${Date.now()}\n\n`);
  }, 25000);

  ordersEmitter.on('orders-updated', onOrdersUpdated);

  req.on('close', () => {
    clearInterval(keepAlive);
    ordersEmitter.off('orders-updated', onOrdersUpdated);
    res.end();
  });
}
