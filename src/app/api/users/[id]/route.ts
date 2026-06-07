import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateUser, deleteUser } from '@/lib/db';
import bcrypt from 'bcryptjs';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const { name, role, password } = await req.json();

  const updates: any = {};
  if (name)     updates.name = name;
  if (role)     updates.role = role;
  if (password) updates.password = bcrypt.hashSync(password, 10);

  await updateUser(id, updates);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, ctx: Ctx) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  await deleteUser(id);
  return NextResponse.json({ ok: true });
}
