'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('admin@company.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const r = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (r.ok) { router.push('/services'); router.refresh(); }
    else { const j = await r.json(); setError(j.error || 'Invalid credentials'); setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f0f2f5', fontFamily: 'Inter, system-ui, sans-serif', WebkitFontSmoothing: 'antialiased' }}>

      {/* ── Left brand panel ─────────────────────────────────────────── */}
      <div style={{
        width: 460, background: '#1d4ed8', flexShrink: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 52px',
      }} className="login-panel">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: '1px solid rgba(255,255,255,.2)' }}>🔐</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: '-.01em' }}>ExpiryTrack</div>
            <div style={{ color: 'rgba(255,255,255,.55)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.07em', marginTop: 1 }}>Cluster Company</div>
          </div>
        </div>

        {/* Hero text */}
        <div>
          <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-.025em', marginBottom: 16 }}>
            Never miss a<br />service renewal
          </h1>
          <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 15, lineHeight: 1.75, marginBottom: 36 }}>
            Track every domain, SSL certificate, license and subscription. Get instant alerts before anything expires.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '🌐', text: 'Domains, SSL & hosting tracking'    },
              { icon: '📱', text: 'Telegram & WhatsApp alerts'          },
              { icon: '📧', text: 'Email notifications to your team'    },
              { icon: '👥', text: 'Multi-user access control'           },
              { icon: '⬆',  text: 'Bulk import from Excel / KeePass'   },
            ].map(f => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{f.icon}</div>
                <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 13, fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 12 }}>© 2026 ExpiryTrack · Cluster Company WLL</p>
      </div>

      {/* ── Right login form ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }} className="login-mobile-logo">
            <div style={{ width: 54, height: 54, borderRadius: 14, background: '#1d4ed8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 12, boxShadow: '0 4px 16px rgba(29,78,216,.35)' }}>🔐</div>
            <div style={{ fontWeight: 800, fontSize: 22, color: '#111827', letterSpacing: '-.01em' }}>ExpiryTrack</div>
            <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 3 }}>Cluster Company</div>
          </div>

          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#111827', letterSpacing: '-.015em', marginBottom: 4 }}>Sign in</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>Enter your credentials to continue</p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#7f1d1d', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Email Address
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="admin@company.com" 
                required autoComplete="email"
                style={{ background: '#fff', border: '1.5px solid #e2e5ea', borderRadius: 8, padding: '11px 14px', fontSize: 14, width: '100%', outline: 'none', fontFamily: 'inherit', transition: 'border .15s, box-shadow .15s', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#1d4ed8'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,.12)'; }}
                onBlur={e  => { e.target.style.borderColor = '#e2e5ea'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Password
              </label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
                style={{ background: '#fff', border: '1.5px solid #e2e5ea', borderRadius: 8, padding: '11px 14px', fontSize: 14, width: '100%', outline: 'none', fontFamily: 'inherit', transition: 'border .15s, box-shadow .15s', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#1d4ed8'; e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,.12)'; }}
                onBlur={e  => { e.target.style.borderColor = '#e2e5ea'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                marginTop: 4, background: loading ? '#93c5fd' : '#1d4ed8',
                color: '#fff', border: 'none', borderRadius: 8,
                padding: '13px 0', fontWeight: 700, fontSize: 15,
                cursor: loading ? 'wait' : 'pointer', width: '100%',
                fontFamily: 'inherit', letterSpacing: '-.01em',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(29,78,216,.35)',
                transition: 'all .2s',
              }}
            >
              {loading ? '⏳ Signing in…' : 'Sign in →'}
            </button>
          </form>

          {/* <div style={{ marginTop: 28, padding: '14px 16px', background: '#f8f9fb', border: '1px solid #e2e5ea', borderRadius: 8, fontSize: 12, color: '#9ca3af' }}>
            <span style={{ color: '#6b7280', fontWeight: 600 }}>Default:</span> admin@company.com / admin123
          </div> */}
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .login-panel { display: none !important; }
          .login-mobile-logo { display: block !important; }
        }
        @media (min-width: 861px) {
          .login-mobile-logo { display: none !important; }
        }
      `}</style>
    </div>
  );
}
