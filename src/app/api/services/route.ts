import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAllServices, createService } from '@/lib/db';
export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await getAllServices());
}
export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const b = await req.json();
  if (!b.name || !b.expiry_date) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const id = await createService({ name:b.name,type:b.type||'Other',vendor:b.vendor||'',expiry_date:b.expiry_date,cost:b.cost?Number(b.cost):null,currency:b.currency||'USD',auto_renewal:!!b.auto_renewal,notes:b.notes||'',website:b.website||'',account_num:b.account_num||'',notify_30:b.notify_30!==false,notify_15:b.notify_15!==false,notify_7:b.notify_7!==false,notify_1:b.notify_1!==false });
  return NextResponse.json({ id }, { status: 201 });
}
