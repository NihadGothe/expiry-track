import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTelegramSettings, saveTelegramSettings } from '@/lib/db';
export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const s = await getTelegramSettings();
  return NextResponse.json({ bot_token: s?.bot_token||'', chat_ids: s?.chat_ids||[] });
}
export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { bot_token, chat_ids } = await req.json();
  await saveTelegramSettings(bot_token, chat_ids);
  return NextResponse.json({ ok: true });
}
