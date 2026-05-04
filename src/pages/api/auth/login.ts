
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
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
  const usersPath = path.join(process.cwd(), 'users-data.json');
  let users;
  try {
    users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi đọc file users.json hoặc file không hợp lệ.' });
  }
  const user = users.find((u: any) => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  if (user.password === password || bcrypt.compareSync(password, user.password)) {
    return res.status(200).json({ success: true, username, role: user.role });
  }
  return res.status(401).json({ error: 'Invalid password' });
}
