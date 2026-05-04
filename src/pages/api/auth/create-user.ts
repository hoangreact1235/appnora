import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { username, password, displayName } = req.body;
  if (!username || !password || !displayName) {
    return res.status(400).json({ error: 'Thiếu thông tin' });
  }
  const usersPath = path.join(process.cwd(), 'users-data.json');
  let users = [];
  try {
    users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  } catch (err) {}
  if (users.find((u: any) => u.username === username)) {
    return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const staffRole = ['design', 'video'].includes(req.body.role) ? req.body.role : 'design';
  users.push({ username, password: hash, displayName, role: staffRole });
  try {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf8');
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi ghi file' });
  }
}
