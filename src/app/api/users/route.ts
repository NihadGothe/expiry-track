import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllUsers, createUser } from '@/lib/db';
import bcrypt from 'bcryptjs';
export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await getAllUsers());
}
export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name, email, password, role } = await req.json();
  if (!email || !password || password.length < 6) return NextResponse.json({ error: 'Email and password (min 6 chars) required' }, { status: 400 });
  await createUser({ name:name||email, email, password:bcrypt.hashSync(password,10), role:role||'viewer' });
  return NextResponse.json({ ok:true }, { status: 201 });
}
