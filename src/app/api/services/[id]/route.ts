import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getService, updateService, deleteService } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, ctx: Ctx) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const s = await getService(id);
  return s ? NextResponse.json(s) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const b = await req.json();
  await updateService(id, {
    name: b.name, type: b.type||'Other', vendor: b.vendor||'',
    expiry_date: b.expiry_date, cost: b.cost ? Number(b.cost) : null,
    currency: b.currency||'USD', auto_renewal: !!b.auto_renewal,
    notes: b.notes||'', website: b.website||'', account_num: b.account_num||'',
    purchase_date: b.purchase_date||'', frequency: b.frequency||'',
    renew: b.renew||'', card: b.card||'', card_expiry: b.card_expiry||'',
    username: b.username||'', password: b.password||'',
    registered_email: b.registered_email||'', remarks: b.remarks||'',
    notify_30: !!b.notify_30, notify_15: !!b.notify_15,
    notify_7: !!b.notify_7, notify_1: !!b.notify_1,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, ctx: Ctx) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: 'No ID provided' }, { status: 400 });
    await deleteService(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Delete error:', err);
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 });
  }
}
