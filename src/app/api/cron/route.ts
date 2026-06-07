import { NextRequest, NextResponse } from 'next/server';
import {
  getServicesForReminders, getTelegramSettings,
  getNotificationSettings, wasAlertSent, markAlertSent,
} from '@/lib/db';
import { sendToAll, buildReminderMessage, buildEmailHTML } from '@/lib/telegram';

export async function GET(req: NextRequest) {
  const host   = req.headers.get('host') || '';
  const secret = req.nextUrl.searchParams.get('secret');
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  if (!isLocal && secret !== (process.env.CRON_SECRET || 'expirytrack-cron'))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [tgCfg, notifCfg] = await Promise.all([getTelegramSettings(), getNotificationSettings()]);
  const services = await getServicesForReminders();

  const INTERVALS = [
    { days: 30, key: 'notify_30' },
    { days: 15, key: 'notify_15' },
    { days:  7, key: 'notify_7'  },
    { days:  1, key: 'notify_1'  },
  ];

  const sent: string[] = [];
  const skipped: string[] = [];

  for (const svc of services) {
    for (const { days, key } of INTERVALS) {
      if (svc.days_left > days || svc.days_left < days - 1) continue;
      if (!svc[key]) { skipped.push(`${svc.name} (disabled)`); continue; }
      if (await wasAlertSent(svc._id || svc.id, days)) { skipped.push(`${svc.name} (already sent)`); continue; }

      const svcData = { name: svc.name, type: svc.type, vendor: svc.vendor, expiry_date: svc.expiry_date, days_left: svc.days_left, website: svc.website };
      let anySent = false;

      // ── Telegram ──────────────────────────────────────────────────────
      if (tgCfg?.bot_token && tgCfg?.chat_ids?.length) {
        const msg = buildReminderMessage(svcData);
        const r = await sendToAll(tgCfg.bot_token, tgCfg.chat_ids, msg);
        if (r.sent > 0) anySent = true;
      }

      // ── Email ─────────────────────────────────────────────────────────
      const em = notifCfg.email;
      if (em?.smtp_host && em?.smtp_user && em?.smtp_pass && em?.recipients?.length) {
        try {
          const nodemailer = await import('nodemailer');
          const transporter = nodemailer.default.createTransport({
            host: em.smtp_host, port: Number(em.smtp_port) || 587,
            secure: Number(em.smtp_port) === 465,
            auth: { user: em.smtp_user, pass: em.smtp_pass },
          });
          const { subject, html } = buildEmailHTML(svcData);
          await transporter.sendMail({
            from: em.smtp_from || em.smtp_user,
            to: em.recipients.join(', '),
            subject, html,
          });
          anySent = true;
        } catch (e: any) {
          console.error('Email send error:', e.message);
        }
      }

      // ── WhatsApp (CallMeBot) ───────────────────────────────────────────
      const wa = notifCfg.whatsapp;
      if (wa?.api_key && wa?.numbers?.length) {
        const plainMsg = buildReminderMessage(svcData).replace(/\*/g, '').replace(/_/g, '');
        for (const phone of wa.numbers) {
          try {
            const clean = phone.replace(/[\s\-\(\)]/g, '');
            const url = `https://api.callmebot.com/whatsapp.php?phone=${clean}&text=${encodeURIComponent(plainMsg)}&apikey=${wa.api_key}`;
            await fetch(url, { signal: AbortSignal.timeout(10000) });
            anySent = true;
          } catch {}
        }
      }

      // ── Mark sent if any channel delivered ────────────────────────────
      if (anySent) {
        await markAlertSent(svc._id || svc.id, days, {
          service_name: svc.name, vendor: svc.vendor, expiry_date: svc.expiry_date,
        });
        sent.push(`${svc.name} (${days}d)`);
      }
    }
  }

  return NextResponse.json({
    ok: true, checked: services.length, sent, skipped,
    timestamp: new Date().toISOString(),
  });
}
