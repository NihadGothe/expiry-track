'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/services',      icon: '🗂️',  label: 'Services'       },
  { href: '/notifications', icon: '🔔',  label: 'Alert History'  },
  { href: '/users',         icon: '👥',  label: 'Users'          },
  { href: '/settings',      icon: '⚙️',  label: 'Settings'       },
];

interface Props {
  user: any;
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ user, open, onClose }: Props) {
  const path = usePathname();

  return (
    <>
      {/* Overlay for mobile */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Brand */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--brand)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: '0 2px 8px rgba(29,78,216,.3)',
            }}>
              <span style={{ fontSize: 18 }}>🔐</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', letterSpacing: '-.01em' }}>ExpiryTrack</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, marginTop: 1, textTransform: 'uppercase', letterSpacing: '.05em' }}>Cluster Company</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          <div className="nav-section-label">Main</div>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} onClick={onClose}
              className={`nav-item ${path.startsWith(n.href) ? 'active' : ''}`}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--brand)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0,
            }}>
              {String(user?.email || 'A').toUpperCase()[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 1 }}>{user?.role || 'Admin'}</div>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="btn btn-secondary" style={{ width: '100%', fontSize: 12, padding: '6px 12px', justifyContent: 'center' }}>
              ↩ Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
