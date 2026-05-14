import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { redisGet } from '../../../lib/redis';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  let username = '';
  let password = '';
  try {
    if (typeof req.body === 'string') {
      // Nếu body là string (do curl gửi), parse lại
      const parsed = JSON.parse(req.body);
      username = parsed.username;
      password = parsed.password;
    } else {
      username = req.body.username;
      password = req.body.password;
    }
  } catch (err) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  let users;
  try {
    let raw = await redisGet('nora_users_data');
    if (!raw) {
      // First run: seed from local file into Redis
      try {
        const localPath = path.join(process.cwd(), 'users-data.json');
        raw = fs.readFileSync(localPath, 'utf8');
        const { redisSet } = await import('../../../lib/redis');
        await redisSet('nora_users_data', raw);
      } catch {
        raw = null;
      }
    }
    users = raw ? JSON.parse(raw) : [];
    if (!users.length) {
      return res.status(500).json({ error: 'Không tìm thấy dữ liệu người dùng.' });
    }
  } catch (err) {
    console.error('login storage error', err);
    return res.status(500).json({ error: 'Lỗi đọc dữ liệu người dùng.' });
  }
  const user = users.find((u: any) => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  if (user.password === password || bcrypt.compareSync(password, user.password)) {
    return res.status(200).json({
      success: true,
      username,
      role: user.role,
      displayName: user.displayName || username
    });
  }
  return res.status(401).json({ error: 'Invalid password' });
}
