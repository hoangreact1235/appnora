import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { redisGet, redisSet } from '../../../lib/redis';

const USERS_KEY = 'nora_users_data';

async function readUsers(): Promise<any[]> {
  let raw = await redisGet(USERS_KEY);
  if (!raw) {
    try {
      const localPath = path.join(process.cwd(), 'users-data.json');
      raw = fs.readFileSync(localPath, 'utf8');
      await redisSet(USERS_KEY, raw);
    } catch {
      return [];
    }
  }

  return raw ? JSON.parse(raw) : [];
}

async function writeUsers(users: any[]): Promise<void> {
  await redisSet(USERS_KEY, JSON.stringify(users, null, 2));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET: danh sách nhân viên (không trả password)
    if (req.method === 'GET') {
      const users = await readUsers();
      const staff = users
        .filter((u: any) => u.role !== 'admin')
        .map((u: any) => ({ username: u.username, displayName: u.displayName, role: u.role }));
      return res.json({ staff });
    }

    // DELETE: xóa nhân viên
    if (req.method === 'DELETE') {
      const { username } = req.body;
      if (!username) return res.status(400).json({ error: 'Thiếu username' });
      const users = await readUsers();
      const target = users.find((u: any) => u.username === username);
      if (!target) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
      if (target.role === 'admin') return res.status(403).json({ error: 'Không thể xóa tài khoản admin' });
      const newUsers = users.filter((u: any) => u.username !== username);
      await writeUsers(newUsers);
      return res.json({ success: true });
    }

    // PATCH: reset mật khẩu
    if (req.method === 'PATCH') {
      const { username } = req.body;
      if (!username) return res.status(400).json({ error: 'Thiếu username' });
      const users = await readUsers();
      const idx = users.findIndex((u: any) => u.username === username);
      if (idx === -1) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
      if (users[idx].role === 'admin') return res.status(403).json({ error: 'Không thể reset mật khẩu admin' });
      const newPass = Math.random().toString(36).slice(2, 10);
      users[idx].password = bcrypt.hashSync(newPass, 10);
      await writeUsers(users);
      return res.json({ success: true, newPassword: newPass });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('staff api storage error', error);
    return res.status(500).json({ error: 'Không thể đọc hoặc lưu dữ liệu nhân viên lúc này.' });
  }
}
