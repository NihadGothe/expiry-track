'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TYPES = ['Domain','SSL','Hosting','VPS','Dedicated Server','Cloud Service','Microsoft License','Google Workspace','Email Service','License','Subscription','Support Contract','Maintenance Contract','Other'];
const CURRENCIES = ['USD','EUR','GBP','AED','SAR','QAR','KWD','INR','PKR'];
const FREQ = ['Monthly','Quarterly','Half-Yearly','Yearly','2 Years','3 Years','One-time'];

export default function EditClient({ service, id }: { service: any; id: string }) {
  const router = useRouter();
  const [form, setForm] = useState<any>({ ...service, cost: service.cost ?? '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const upd = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name) { setError('Service name is required'); return; }
    setSaving(true); setError('');
    const r = await fetch(`/api/services/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (r.ok) router.push(`/services/${id}`);
    else { const d = await r.json(); setError(d.error||'Failed to save'); setSaving(false); }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:28 }}>
        <Link href={`/services/${id}`} style={{ color:'var(--text2)',textDecoration:'none',fontSize:20 }}>←</Link>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700,letterSpacing:'-.02em' }}>Edit Service</h1>
          <p style={{ color:'var(--text2)',fontSize:13 }}>{service.name}</p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom:20 }}>{error}</div>}

      <div style={{ display:'flex',flexDirection:'column',gap:18 }}>
        <Section title="Basic Information">
          <Grid>
            <Field label="Service Name *"><input value={form.name||''} onChange={e=>upd('name',e.target.value)} /></Field>
            <Field label="Type"><select value={form.type||''} onChange={e=>upd('type',e.target.value)}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></Field>
            <Field label="Provider / Vendor"><input value={form.vendor||''} onChange={e=>upd('vendor',e.target.value)} /></Field>
            <Field label="Status Override"><select value={form.item_status||''} onChange={e=>upd('item_status',e.target.value)}><option value="">Auto (by date)</option><option>Active</option><option>Inactive</option><option>Cancelled</option></select></Field>
          </Grid>
        </Section>

        <Section title="Dates & Renewal">
          <Grid>
            <Field label="Purchase Date"><input type="date" value={form.purchase_date||''} onChange={e=>upd('purchase_date',e.target.value)} /></Field>
            <Field label="Expiry Date"><input type="date" value={form.expiry_date||''} onChange={e=>upd('expiry_date',e.target.value)} /></Field>
            <Field label="Frequency"><select value={form.frequency||'Yearly'} onChange={e=>upd('frequency',e.target.value)}>{FREQ.map(f=><option key={f}>{f}</option>)}</select></Field>
            <Field label="Renew?"><select value={form.renew||''} onChange={e=>upd('renew',e.target.value)}><option value="">Not set</option><option>Yes</option><option>No</option><option>Auto</option></select></Field>
          </Grid>
        </Section>

        <Section title="Cost & Payment">
          <Grid>
            <Field label="Value / Cost"><input type="number" value={form.cost} onChange={e=>upd('cost',e.target.value)} step="0.01" min="0" /></Field>
            <Field label="Currency"><select value={form.currency||'USD'} onChange={e=>upd('currency',e.target.value)}>{CURRENCIES.map(c=><option key={c}>{c}</option>)}</select></Field>
            <Field label="Card Used"><input value={form.card||''} onChange={e=>upd('card',e.target.value)} /></Field>
            <Field label="Card Expiry"><input value={form.card_expiry||''} onChange={e=>upd('card_expiry',e.target.value)} placeholder="MM/YY" /></Field>
          </Grid>
        </Section>

        <Section title="Credentials & Access">
          <Grid>
            <Field label="Username"><input value={form.username||''} onChange={e=>upd('username',e.target.value)} /></Field>
            <Field label="Password"><input type="text" value={form.password||''} onChange={e=>upd('password',e.target.value)} /></Field>
            <Field label="Registered Email"><input type="email" value={form.registered_email||''} onChange={e=>upd('registered_email',e.target.value)} /></Field>
            <Field label="Website"><input type="url" value={form.website||''} onChange={e=>upd('website',e.target.value)} /></Field>
            <Field label="Account / Reference #"><input value={form.account_num||''} onChange={e=>upd('account_num',e.target.value)} /></Field>
          </Grid>
        </Section>

        <Section title="Notes & Remarks">
          <Grid cols={1}>
            <Field label="Notes"><textarea value={form.notes||''} onChange={e=>upd('notes',e.target.value)} rows={2} /></Field>
            <Field label="Remarks"><textarea value={form.remarks||''} onChange={e=>upd('remarks',e.target.value)} rows={2} /></Field>
          </Grid>
        </Section>

        <Section title="Telegram Reminder Schedule">
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10 }}>
            {[['notify_30','30 days'],['notify_15','15 days'],['notify_7','7 days'],['notify_1','1 day']].map(([k,l])=>(
              <label key={k} style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:13,padding:'10px 12px',background:'var(--surface2)',borderRadius:8,border:'1px solid var(--border)' }}>
                <input type="checkbox" checked={!!form[k]} onChange={e=>upd(k,e.target.checked)} style={{ width:15,height:15 }} />
                {l} before
              </label>
            ))}
          </div>
          <label style={{ display:'flex',alignItems:'center',gap:8,marginTop:12,cursor:'pointer',fontSize:13 }}>
            <input type="checkbox" checked={!!form.auto_renewal} onChange={e=>upd('auto_renewal',e.target.checked)} style={{ width:15,height:15 }} />
            Auto-renewal enabled
          </label>
        </Section>
      </div>

      <div style={{ display:'flex',justifyContent:'flex-end',gap:12,marginTop:28,paddingTop:20,borderTop:'1px solid var(--border)' }}>
        <Link href={`/services/${id}`} className="btn btn-secondary">Cancel</Link>
        <button className="btn btn-primary" onClick={save} disabled={saving} style={{ minWidth:140 }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="card">
      <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--border)',fontWeight:600,fontSize:14 }}>{title}</div>
      <div style={{ padding:'18px 20px' }}>{children}</div>
    </div>
  );
}
function Grid({ children, cols=2 }: any) {
  return <div style={{ display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:14 }}>{children}</div>;
}
function Field({ label, children }: any) {
  return <div className="field"><label>{label}</label>{children}</div>;
}
