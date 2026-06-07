import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getNotificationSettings, saveWhatsAppSettings } from '@/lib/db';

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const s = await getNotificationSettings();
  return NextResponse.json(s.whatsapp || {});
}
export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await req.json();
  await saveWhatsAppSettings(data);
  return NextResponse.json({ ok: true });
}
