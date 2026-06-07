import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const user = await getUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const token = await signToken({ id: user._id, email: user.email, role: user.role });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', token, { httpOnly: true, maxAge: 86400*7, path: '/' });
  return res;
}
