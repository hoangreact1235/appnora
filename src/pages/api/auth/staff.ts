import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const USERS_FILE = path.join(process.cwd(), 'users-data.json');

function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeUsers(users: any[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET: danh sách nhân viên (không trả password)
  if (req.method === 'GET') {
    const users = readUsers();
    const staff = users
      .filter((u: any) => u.role !== 'admin')
      .map((u: any) => ({ username: u.username, displayName: u.displayName, role: u.role }));
    return res.json({ staff });
  }

  // DELETE: xóa nhân viên
  if (req.method === 'DELETE') {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Thiếu username' });
    const users = readUsers();
    const target = users.find((u: any) => u.username === username);
    if (!target) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    if (target.role === 'admin') return res.status(403).json({ error: 'Không thể xóa tài khoản admin' });
    const newUsers = users.filter((u: any) => u.username !== username);
    writeUsers(newUsers);
    return res.json({ success: true });
  }

  // PATCH: reset mật khẩu
  if (req.method === 'PATCH') {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Thiếu username' });
    const users = readUsers();
    const idx = users.findIndex((u: any) => u.username === username);
    if (idx === -1) return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    if (users[idx].role === 'admin') return res.status(403).json({ error: 'Không thể reset mật khẩu admin' });
    const newPass = Math.random().toString(36).slice(2, 10);
    users[idx].password = bcrypt.hashSync(newPass, 10);
    writeUsers(users);
    return res.json({ success: true, newPassword: newPass });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
