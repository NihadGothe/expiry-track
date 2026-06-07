export async function sendTelegram(botToken: string, chatId: string, message: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId.trim(), text: message, parse_mode: 'Markdown' }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json() as any;
    return data.ok ? { ok: true } : { ok: false, error: data.description };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function sendToAll(botToken: string, chatIds: string[], message: string): Promise<{ sent: number; failed: number }> {
  let sent = 0, failed = 0;
  for (const id of chatIds) {
    const r = await sendTelegram(botToken, id, message);
    r.ok ? sent++ : failed++;
  }
  return { sent, failed };
}

export function buildReminderMessage(service: {
  name: string; type: string; vendor?: string;
  expiry_date: string; days_left: number; website?: string;
}): string {
  const { name, type, vendor, expiry_date, days_left, website } = service;
  const icon = days_left <= 0 ? '🔴' : days_left <= 3 ? '🚨' : days_left <= 7 ? '⚠️' : '📅';
  const when = days_left < 0
    ? `*EXPIRED* ${Math.abs(days_left)} day(s) ago`
    : days_left === 0 ? '*expires TODAY*'
    : `expires in *${days_left} day${days_left !== 1 ? 's' : ''}*`;

  const lines = [
    `${icon} *ExpiryTrack Alert*`,
    ``,
    `*${name}* ${when}`,
    `📋 Type: ${type}`,
    vendor  ? `🏢 Vendor: ${vendor}`      : null,
    `📅 Expiry: ${expiry_date}`,
    website ? `🔗 Link: ${website}`       : null,
    ``,
    `Login to ExpiryTrack to take action.`,
  ];
  return lines.filter(l => l !== null).join('\n');
}

export function buildEmailHTML(service: {
  name: string; type: string; vendor?: string;
  expiry_date: string; days_left: number; website?: string;
}): { subject: string; html: string } {
  const { name, type, vendor, expiry_date, days_left, website } = service;
  const urgencyColor = days_left <= 0 ? '#dc2626' : days_left <= 7 ? '#d97706' : '#1d4ed8';
  const when = days_left < 0
    ? `EXPIRED ${Math.abs(days_left)} day(s) ago`
    : days_left === 0 ? 'Expires TODAY'
    : `Expires in ${days_left} day${days_left !== 1 ? 's' : ''}`;

  const subject = `${days_left <= 0 ? '🔴' : days_left <= 7 ? '⚠️' : '📅'} ExpiryTrack: ${name} — ${when}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:Inter,Arial,sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)">
    <!-- Header -->
    <div style="background:#1d4ed8;padding:24px 28px;display:flex;align-items:center;gap:12px">
      <div style="font-size:24px">🔐</div>
      <div>
        <div style="color:#fff;font-weight:800;font-size:16px;letter-spacing:-.01em">ExpiryTrack</div>
        <div style="color:rgba(255,255,255,.7);font-size:11px;text-transform:uppercase;letter-spacing:.05em">Cluster Company</div>
      </div>
    </div>
    <!-- Body -->
    <div style="padding:28px">
      <div style="background:${urgencyColor}15;border-left:4px solid ${urgencyColor};border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:22px">
        <div style="font-weight:700;font-size:18px;color:${urgencyColor};margin-bottom:4px">${when}</div>
        <div style="font-size:14px;color:#374151">${name}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr style="border-bottom:1px solid #f0f2f5"><td style="padding:10px 0;color:#6b7280;width:120px">Service</td><td style="padding:10px 0;font-weight:600;color:#111827">${name}</td></tr>
        <tr style="border-bottom:1px solid #f0f2f5"><td style="padding:10px 0;color:#6b7280">Type</td><td style="padding:10px 0;font-weight:600;color:#111827">${type}</td></tr>
        ${vendor ? `<tr style="border-bottom:1px solid #f0f2f5"><td style="padding:10px 0;color:#6b7280">Vendor</td><td style="padding:10px 0;font-weight:600;color:#111827">${vendor}</td></tr>` : ''}
        <tr style="border-bottom:1px solid #f0f2f5"><td style="padding:10px 0;color:#6b7280">Expiry Date</td><td style="padding:10px 0;font-weight:700;color:${urgencyColor}">${expiry_date}</td></tr>
        ${website ? `<tr><td style="padding:10px 0;color:#6b7280">Website</td><td style="padding:10px 0"><a href="${website}" style="color:#1d4ed8">${website}</a></td></tr>` : ''}
      </table>
      <div style="margin-top:24px;text-align:center">
        <a href="http://localhost:3000/services" style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">View in ExpiryTrack →</a>
      </div>
    </div>
    <div style="background:#f8f9fb;padding:14px 28px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e2e5ea">
      ExpiryTrack — Cluster Company · Automated expiry notification
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}
