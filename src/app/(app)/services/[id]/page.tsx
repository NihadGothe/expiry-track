import { getService } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ViewServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const isAdmin = (session as any)?.role === 'admin';
  const s = await getService(id);
  if (!s) notFound();

  const daysColor = s.days_left < 0 ? '#dc2626' : s.days_left <= 7 ? '#dc2626' : s.days_left <= 30 ? '#d97706' : '#16a34a';

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:28,gap:16,flexWrap:'wrap' }}>
        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          <Link href="/services" style={{ color:'var(--text2)',textDecoration:'none',fontSize:20 }}>←</Link>
          <div>
            <h1 style={{ fontSize:22,fontWeight:700,letterSpacing:'-.02em',marginBottom:4 }}>{s.name}</h1>
            <div style={{ display:'flex',alignItems:'center',gap:8 }}>
              <span className="chip">{s.type}</span>
              <span className={`badge badge-${s.status}`}>{s.status}</span>
              {s.expiry_date && (
                <span style={{ fontSize:13,fontWeight:600,color:daysColor }}>
                  {s.days_left < 0 ? `Expired ${Math.abs(s.days_left)}d ago` : s.days_left === 0 ? 'Expires TODAY' : `${s.days_left} days left`}
                </span>
              )}
            </div>
          </div>
        </div>
        {isAdmin && <Link href={`/services/${id}/edit`} className="btn btn-primary">Edit Service</Link>}
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
        {/* Basic */}
        <InfoCard title="Basic Information">
          <Row label="Service Name" value={s.name} />
          <Row label="Type" value={s.type} />
          <Row label="Provider" value={s.vendor} />
          <Row label="Status" value={<span className={`badge badge-${s.status}`}>{s.status}</span>} />
          {s.item_status && <Row label="Item Status" value={s.item_status} />}
          {s.frequency && <Row label="Frequency" value={s.frequency} />}
          {s.renew && <Row label="Renew" value={s.renew} />}
          <Row label="Auto-Renewal" value={s.auto_renewal ? '✅ Yes' : '❌ No'} />
        </InfoCard>

        {/* Dates */}
        <InfoCard title="Dates & Expiry">
          {s.purchase_date && <Row label="Purchase Date" value={s.purchase_date} />}
          <Row label="Expiry Date" value={s.expiry_date || '—'} highlight />
          {s.expiry_date && (
            <Row label="Days Remaining" value={
              <span style={{ fontWeight:700,color:daysColor }}>
                {s.days_left < 0 ? `Expired ${Math.abs(s.days_left)} days ago` : `${s.days_left} days`}
              </span>
            } />
          )}
          <Row label="Created" value={new Date(s.created_at).toLocaleDateString()} />
          {s.updated_at && <Row label="Last Updated" value={new Date(s.updated_at).toLocaleDateString()} />}
        </InfoCard>

        {/* Cost */}
        <InfoCard title="Cost & Payment">
          <Row label="Value / Cost" value={s.cost ? `${s.currency || 'USD'} ${Number(s.cost).toLocaleString()}` : '—'} highlight />
          {s.card && <Row label="Card" value={s.card} />}
          {s.card_expiry && <Row label="Card Expiry" value={s.card_expiry} />}
        </InfoCard>

        {/* Credentials */}
        <InfoCard title="Credentials & Access">
          {s.username && <Row label="Username" value={s.username} />}
          {s.password && <Row label="Password" value={<code style={{ background:'var(--surface2)',padding:'2px 8px',borderRadius:4,fontSize:12 }}>{s.password}</code>} />}
          {s.registered_email && <Row label="Registered Email" value={s.registered_email} />}
          {s.website && <Row label="Website" value={<a href={s.website} target="_blank" rel="noreferrer" style={{ color:'var(--blue)' }}>{s.website}</a>} />}
          {s.account_num && <Row label="Account #" value={s.account_num} />}
        </InfoCard>

        {/* Notifications */}
        <InfoCard title="Telegram Reminders">
          {[['notify_30','30 days before'],['notify_15','15 days before'],['notify_7','7 days before'],['notify_1','1 day before']].map(([k,l])=>(
            <Row key={k} label={l} value={s[k] ? '🔔 Enabled' : '🔕 Disabled'} />
          ))}
        </InfoCard>

        {/* Notes */}
        {(s.notes || s.remarks) && (
          <InfoCard title="Notes & Remarks">
            {s.notes && <div style={{ marginBottom:10 }}><div style={{ fontSize:12,color:'var(--text2)',marginBottom:4,fontWeight:500 }}>Notes</div><p style={{ fontSize:13,lineHeight:1.6,color:'var(--text)' }}>{s.notes}</p></div>}
            {s.remarks && <div><div style={{ fontSize:12,color:'var(--text2)',marginBottom:4,fontWeight:500 }}>Remarks</div><p style={{ fontSize:13,lineHeight:1.6,color:'var(--text)' }}>{s.remarks}</p></div>}
          </InfoCard>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, children }: any) {
  return (
    <div className="card">
      <div style={{ padding:'12px 18px',borderBottom:'1px solid var(--border)',fontWeight:600,fontSize:13,color:'var(--text2)',textTransform:'uppercase',letterSpacing:'.04em' }}>{title}</div>
      <div style={{ padding:'14px 18px',display:'flex',flexDirection:'column',gap:10 }}>{children}</div>
    </div>
  );
}
function Row({ label, value, highlight }: any) {
  return (
    <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,minHeight:22 }}>
      <span style={{ fontSize:13,color:'var(--text2)',flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13,fontWeight:highlight?600:400,textAlign:'right' }}>{value || '—'}</span>
    </div>
  );
}