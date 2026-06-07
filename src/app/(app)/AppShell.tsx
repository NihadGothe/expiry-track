'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function AppShell({ user, children }: { user: any; children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        {/* Mobile topbar */}
        <header className="topbar" style={{ display: 'none' }} id="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text2)', padding: 2 }}>☰</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔐</div>
              <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>ExpiryTrack</span>
            </div>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Cluster Company</div>
        </header>

        <style>{`
          @media (max-width: 1024px) { #mobile-header { display: flex !important; } }
        `}</style>

        <main className="page animate-in">
          {children}
        </main>
      </div>
    </div>
  );
}
