export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const usersPath = path.join(process.cwd(), 'src/app/auth/users.json');
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const user = users.find((u: any) => u.username === username);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }
  // So sánh mật khẩu (ở đây là hash giả, cần thay bằng hash thật nếu dùng bcrypt)
  if (user.password === password || bcrypt.compareSync(password, user.password)) {
    // Tạo session/token đơn giản
    return NextResponse.json({ success: true, username, role: user.role });
  }
  return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
}
