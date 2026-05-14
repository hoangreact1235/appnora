import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { redisGet, redisSet } from '../../../lib/redis';

const USERS_KEY = 'nora_users_data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { username, password, displayName } = req.body;
  if (!username || !password || !displayName) {
    return res.status(400).json({ error: 'Thiếu thông tin' });
  }
  let users: any[] = [];
  try {
    let raw = await redisGet(USERS_KEY);
    if (!raw) {
      // First run: seed from local file
      try {
        const localPath = path.join(process.cwd(), 'users-data.json');
        raw = fs.readFileSync(localPath, 'utf8');
        await redisSet(USERS_KEY, raw);
      } catch { raw = null; }
    }
    users = raw ? JSON.parse(raw) : [];
  } catch (err) {}
  if (users.find((u: any) => u.username === username)) {
    return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const staffRole = ['design', 'video'].includes(req.body.role) ? req.body.role : 'design';
  users.push({ username, password: hash, displayName, role: staffRole });
  try {
    await redisSet(USERS_KEY, JSON.stringify(users, null, 2));
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi lưu dữ liệu' });
  }
}
