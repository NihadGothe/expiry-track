import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { bulkInsertServices } from '@/lib/db';

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { services } = await req.json();
  if (!Array.isArray(services) || services.length === 0)
    return NextResponse.json({ error: 'No services provided' }, { status: 400 });

  // Clean up each row — no validation, just normalize
  const clean = services.map((s: any) => ({
    name:             s.name || s.item || 'Unnamed Service',
    type:             s.type || 'Other',
    vendor:           s.vendor || s.provider || '',
    purchase_date:    s.purchase_date || '',
    expiry_date:      s.expiry_date || '',
    frequency:        s.frequency || '',
    renew:            s.renew || '',
    cost:             s.cost ? Number(String(s.cost).replace(/[^0-9.]/g,'')) || null : null,
    currency:         s.currency || 'USD',
    card:             s.card || '',
    card_expiry:      s.card_expiry || '',
    username:         s.username || '',
    password:         s.password || '',
    registered_email: s.registered_email || s.email || '',
    website:          s.website || '',
    account_num:      s.account_num || '',
    notes:            s.notes || '',
    remarks:          s.remarks || '',
    item_status:      s.item_status || s.status || '',
    auto_renewal:     s.renew === 'Auto' || s.auto_renewal || false,
    notify_30:        true,
    notify_15:        true,
    notify_7:         true,
    notify_1:         true,
  }));

  await bulkInsertServices(clean);
  return NextResponse.json({ ok: true, imported: clean.length });
}
