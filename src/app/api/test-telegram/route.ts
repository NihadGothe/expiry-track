import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sendToAll } from '@/lib/telegram';
export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { bot_token, chat_ids } = await req.json();
  if (!bot_token || !chat_ids?.length) return NextResponse.json({ ok: false, error: 'Token and Chat ID required' }, { status: 400 });
  const r = await sendToAll(bot_token, chat_ids, '✅ *ExpiryTrack* — Test message\\!\n\nTelegram notifications are working\\. You will receive alerts when services are about to expire\\. 🎉');
  return NextResponse.json(r.sent > 0 ? { ok:true,sent:r.sent } : { ok:false,error:`Failed. Check bot token and chat IDs.` });
}
