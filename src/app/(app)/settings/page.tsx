'use client';
import { useState, useEffect } from 'react';

type Tab = 'telegram' | 'email' | 'whatsapp';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('telegram');

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-sub">Configure notification channels for your team</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {([
          ['telegram', '📱 Telegram'],
          ['email',    '📧 Email'],
          ['whatsapp', '💬 WhatsApp'],
        ] as [Tab, string][]).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: 7, fontSize: 13, fontWeight: 500,
            border: 'none', cursor: 'pointer',
            background: tab === t ? 'var(--brand)' : 'transparent',
            color: tab === t ? '#fff' : 'var(--text2)',
            transition: 'all .15s',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'telegram'  && <TelegramSettings />}
      {tab === 'email'     && <EmailSettings />}
      {tab === 'whatsapp'  && <WhatsAppSettings />}

      {/* Reminder schedule - always shown */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="section-title">🗓️ Reminder Schedule</div>
        <div style={{ padding: '18px 20px' }}>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
            Alerts are sent automatically to all configured channels at these intervals before expiry:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
            {[{ d:30,i:'📅',c:'var(--text2)' },{ d:15,i:'📅',c:'var(--amber)' },{ d:7,i:'⚠️',c:'var(--amber)' },{ d:1,i:'🚨',c:'var(--red)' }].map(r=>(
              <div key={r.d} style={{ background:'var(--surface2)',borderRadius:10,padding:'14px 12px',textAlign:'center',border:'1px solid var(--border)' }}>
                <div style={{ fontSize:22,marginBottom:6 }}>{r.i}</div>
                <div style={{ fontWeight:700,fontSize:16,color:r.c }}>{r.d}d</div>
                <div style={{ fontSize:11,color:'var(--text3)',marginTop:2 }}>before expiry</div>
              </div>
            ))}
          </div>
          <div className="alert alert-info" style={{ fontSize:12 }}>
            <span>💡</span>
            <span>Trigger alerts now: open <code style={{ background:'rgba(29,78,216,.1)',padding:'1px 6px',borderRadius:4 }}>http://localhost:3000/api/cron</code> in browser, or set up Windows Task Scheduler to run it daily at 9 AM.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Telegram ────────────────────────────────────────────────────────────────
function TelegramSettings() {
  const [token, setToken] = useState('');
  const [chatIds, setChatIds] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{type:string;text:string}|null>(null);

  useEffect(() => {
    fetch('/api/settings').then(r=>r.json()).then(d=>{
      setToken(d.bot_token||''); setChatIds((d.chat_ids||[]).join('\n'));
    });
  }, []);

  async function save() {
    setSaving(true); setMsg(null);
    const ids = chatIds.split(/[\n,]/).map(s=>s.trim()).filter(Boolean);
    const r = await fetch('/api/settings', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ bot_token:token, chat_ids:ids }) });
    setSaving(false);
    setMsg(r.ok ? {type:'success',text:'Settings saved!'} : {type:'error',text:'Save failed'});
    setTimeout(()=>setMsg(null),4000);
  }

  async function test() {
    setTesting(true); setMsg(null);
    const ids = chatIds.split(/[\n,]/).map(s=>s.trim()).filter(Boolean);
    const r = await fetch('/api/test-telegram', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ bot_token:token, chat_ids:ids }) });
    const d = await r.json();
    setMsg(d.ok ? {type:'success',text:`✅ Test sent to ${d.sent} recipient(s)!`} : {type:'error',text:`❌ ${d.error}`});
    setTesting(false);
  }

  return (
    <div className="card">
      <div className="section-title">📱 Telegram Bot Notifications</div>
      <div style={{ padding:'20px' }}>
        <div className="alert alert-info" style={{ marginBottom:20 }}>
          <span>⚡</span>
          <div>
            <strong>Setup (3 min):</strong>
            <ol style={{ paddingLeft:18,marginTop:6,lineHeight:2,fontSize:12 }}>
              <li>Open Telegram → search <strong>@BotFather</strong> → send <code style={{background:'rgba(29,78,216,.1)',padding:'1px 5px',borderRadius:3}}>/newbot</code></li>
              <li>Follow prompts → copy the <strong>Bot Token</strong></li>
              <li>Open your bot → press <strong>Start</strong></li>
              <li>Visit <code style={{background:'rgba(29,78,216,.1)',padding:'1px 5px',borderRadius:3,fontSize:11}}>https://api.telegram.org/bot TOKEN/getUpdates</code> → find your <strong>Chat ID</strong></li>
            </ol>
          </div>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div className="field">
            <label>Bot Token</label>
            <input value={token} onChange={e=>setToken(e.target.value)} placeholder="1234567890:AAFxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" style={{fontFamily:'monospace',fontSize:12}} />
          </div>
          <div className="field">
            <label>Chat IDs — one per line (supports multiple recipients)</label>
            <textarea value={chatIds} onChange={e=>setChatIds(e.target.value)} rows={4} placeholder={'644937563\n987654321\n555000123'} style={{fontFamily:'monospace',fontSize:13}} />
            <span className="field-hint">Add each person's Chat ID on a new line — all will receive alerts simultaneously</span>
          </div>
          {msg && <div className={`alert alert-${msg.type}`}><span>{msg.type==='success'?'✅':'❌'}</span><span>{msg.text}</span></div>}
          <div style={{ display:'flex',gap:10 }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving…':'Save Settings'}</button>
            <button className="btn btn-secondary" onClick={test} disabled={testing||!token||!chatIds.trim()}>{testing?'Sending…':'📤 Send Test'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Email ────────────────────────────────────────────────────────────────────
function EmailSettings() {
  const [form, setForm] = useState({ smtp_host:'', smtp_port:'587', smtp_user:'', smtp_pass:'', smtp_from:'', recipients:'' });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{type:string;text:string}|null>(null);

  useEffect(() => {
    fetch('/api/settings/email').then(r=>r.json()).then(d=>{
      if (d) setForm({ smtp_host:d.smtp_host||'', smtp_port:d.smtp_port||'587', smtp_user:d.smtp_user||'', smtp_pass:d.smtp_pass||'', smtp_from:d.smtp_from||'', recipients:(d.recipients||[]).join('\n') });
    });
  }, []);

  const upd = (k:string,v:string) => setForm(f=>({...f,[k]:v}));

  async function save() {
    setSaving(true); setMsg(null);
    const body = { ...form, recipients: form.recipients.split(/[\n,]/).map(s=>s.trim()).filter(Boolean) };
    const r = await fetch('/api/settings/email', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    setSaving(false);
    setMsg(r.ok ? {type:'success',text:'Email settings saved!'} : {type:'error',text:'Save failed'});
    setTimeout(()=>setMsg(null),4000);
  }

  async function test() {
    setTesting(true); setMsg(null);
    const body = { ...form, recipients: form.recipients.split(/[\n,]/).map(s=>s.trim()).filter(Boolean) };
    const r = await fetch('/api/test-email', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const d = await r.json();
    setMsg(d.ok ? {type:'success',text:`✅ Test email sent to ${d.sent} recipient(s)!`} : {type:'error',text:`❌ ${d.error}`});
    setTesting(false);
  }

  return (
    <div className="card">
      <div className="section-title">📧 Email Notifications (SMTP)</div>
      <div style={{ padding:'20px' }}>
        <div className="alert alert-info" style={{ marginBottom:20 }}>
          <span>💡</span>
          <span><strong>Gmail tip:</strong> Enable 2FA → Google Account → Security → App Passwords → generate one for "Mail". Use that as the password below.</span>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 120px',gap:12 }}>
            <div className="field"><label>SMTP Host</label><input value={form.smtp_host} onChange={e=>upd('smtp_host',e.target.value)} placeholder="smtp.gmail.com" /></div>
            <div className="field"><label>Port</label><input value={form.smtp_port} onChange={e=>upd('smtp_port',e.target.value)} placeholder="587" /></div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
            <div className="field"><label>SMTP Username</label><input value={form.smtp_user} onChange={e=>upd('smtp_user',e.target.value)} placeholder="your@gmail.com" /></div>
            <div className="field"><label>SMTP Password / App Password</label><input type="password" value={form.smtp_pass} onChange={e=>upd('smtp_pass',e.target.value)} placeholder="••••••••••••••••" /></div>
          </div>
          <div className="field"><label>From Email (displayed to recipients)</label><input value={form.smtp_from} onChange={e=>upd('smtp_from',e.target.value)} placeholder="renewals@cluster.com.qa" /></div>
          <div className="field">
            <label>Recipient Emails — one per line (multiple supported)</label>
            <textarea value={form.recipients} onChange={e=>upd('recipients',e.target.value)} rows={4} placeholder={'admin@cluster.com.qa\nit@cluster.com.qa\nmanager@cluster.com.qa'} />
            <span className="field-hint">All listed emails receive every expiry alert</span>
          </div>
          {msg && <div className={`alert alert-${msg.type}`}><span>{msg.type==='success'?'✅':'❌'}</span><span>{msg.text}</span></div>}
          <div style={{ display:'flex',gap:10 }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving…':'Save Settings'}</button>
            <button className="btn btn-secondary" onClick={test} disabled={testing||!form.smtp_host||!form.recipients}>{testing?'Sending…':'📤 Send Test Email'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── WhatsApp ─────────────────────────────────────────────────────────────────
function WhatsAppSettings() {
  const [numbers, setNumbers] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{type:string;text:string}|null>(null);

  useEffect(() => {
    fetch('/api/settings/whatsapp').then(r=>r.json()).then(d=>{
      if (d) { setNumbers((d.numbers||[]).join('\n')); setApiKey(d.api_key||''); }
    });
  }, []);

  async function save() {
    setSaving(true); setMsg(null);
    const body = { numbers: numbers.split(/[\n,]/).map(s=>s.trim()).filter(Boolean), api_key: apiKey };
    const r = await fetch('/api/settings/whatsapp', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    setSaving(false);
    setMsg(r.ok?{type:'success',text:'WhatsApp settings saved!'}:{type:'error',text:'Save failed'});
    setTimeout(()=>setMsg(null),4000);
  }

  async function test() {
    setTesting(true); setMsg(null);
    const body = { numbers: numbers.split(/[\n,]/).map(s=>s.trim()).filter(Boolean), api_key: apiKey };
    const r = await fetch('/api/test-whatsapp', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    const d = await r.json();
    setMsg(d.ok?{type:'success',text:`✅ WhatsApp sent to ${d.sent} number(s)!`}:{type:'error',text:`❌ ${d.error}`});
    setTesting(false);
  }

  return (
    <div className="card">
      <div className="section-title">💬 WhatsApp Notifications (CallMeBot)</div>
      <div style={{ padding:'20px' }}>
        <div className="alert alert-info" style={{ marginBottom:20 }}>
          <span>⚡</span>
          <div>
            <strong>Setup per phone number:</strong>
            <ol style={{ paddingLeft:18,marginTop:6,lineHeight:2,fontSize:12 }}>
              <li>Save <strong>+34 644 60 21 38</strong> as "CallMeBot" in contacts</li>
              <li>Send on WhatsApp: <code style={{background:'rgba(29,78,216,.1)',padding:'1px 5px',borderRadius:3}}>I allow callmebot to send me messages</code></li>
              <li>You'll receive an <strong>API Key</strong> in reply</li>
              <li>Use the same API key for all numbers registered via the same account</li>
            </ol>
          </div>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <div className="field">
            <label>CallMeBot API Key</label>
            <input value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="Paste your API key from CallMeBot" style={{fontFamily:'monospace'}} />
          </div>
          <div className="field">
            <label>WhatsApp Numbers — one per line (with country code)</label>
            <textarea value={numbers} onChange={e=>setNumbers(e.target.value)} rows={4} placeholder={'+97450xxxxxxx\n+97455xxxxxxx\n+44790xxxxxxx'} />
            <span className="field-hint">Include country code. Each number must have individually activated CallMeBot.</span>
          </div>
          {msg && <div className={`alert alert-${msg.type}`}><span>{msg.type==='success'?'✅':'❌'}</span><span>{msg.text}</span></div>}
          <div style={{ display:'flex',gap:10 }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving…':'Save Settings'}</button>
            <button className="btn btn-secondary" onClick={test} disabled={testing||!numbers.trim()||!apiKey}>{testing?'Sending…':'📤 Send Test'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
