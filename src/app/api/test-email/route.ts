import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, recipients } = await req.json();
  if (!smtp_host || !smtp_user || !smtp_pass || !recipients?.length)
    return NextResponse.json({ ok: false, error: 'SMTP settings incomplete' }, { status: 400 });

  try {
    // Dynamic import to avoid build issues
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      host: smtp_host, port: Number(smtp_port) || 587,
      secure: Number(smtp_port) === 465,
      auth: { user: smtp_user, pass: smtp_pass },
    });
    await transporter.verify();
    await transporter.sendMail({
      from: smtp_from || smtp_user,
      to: recipients.join(', '),
      subject: '✅ ExpiryTrack — Test Email',
      html: `<div style="font-family:sans-serif;max-width:500px;padding:24px">
        <h2 style="color:#1d4ed8">🔐 ExpiryTrack — Cluster Company</h2>
        <p>This is a test email from your ExpiryTrack notification system.</p>
        <p style="color:#6b7280;font-size:13px">If you received this, email notifications are working correctly.</p>
      </div>`,
    });
    return NextResponse.json({ ok: true, sent: recipients.length });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
