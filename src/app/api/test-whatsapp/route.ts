import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { numbers, api_key, bot_token, chat_ids } = await req.json();

  // Support both Telegram and WhatsApp test from this route
  if (bot_token && chat_ids) {
    const { sendToAll } = await import('@/lib/telegram');
    const r = await sendToAll(bot_token, chat_ids, '✅ *ExpiryTrack* — Test message\\!\n\nTelegram notifications are working correctly\\. 🎉');
    return NextResponse.json(r.sent > 0 ? { ok: true, sent: r.sent } : { ok: false, error: 'All failed. Check token and chat IDs.' });
  }

  // CallMeBot WhatsApp
  if (!numbers?.length || !api_key) return NextResponse.json({ ok: false, error: 'Numbers and API key required' }, { status: 400 });
  let sent = 0;
  for (const phone of numbers) {
    const clean = phone.replace(/[\s\-\(\)]/g, '');
    const msg = encodeURIComponent('✅ ExpiryTrack Alert — Test message from Cluster Company. WhatsApp notifications are working!');
    const url = `https://api.callmebot.com/whatsapp.php?phone=${clean}&text=${msg}&apikey=${api_key}`;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const body = await r.text();
      if (body.toLowerCase().includes('queued') || body.toLowerCase().includes('success')) sent++;
    } catch {}
  }
  return NextResponse.json(sent > 0 ? { ok: true, sent } : { ok: false, error: 'All messages failed. Check numbers and API key.' });
}
