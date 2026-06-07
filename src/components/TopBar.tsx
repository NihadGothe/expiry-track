'use client';
import { useState } from 'react';

interface Props { title: string; onMenuClick: () => void; }

export default function TopBar({ title, onMenuClick }: Props) {
  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Hamburger - mobile only */}
        <button
          onClick={onMenuClick}
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, fontSize: 20, color: 'var(--text2)' }}
          className="menu-btn"
          aria-label="Menu"
        >☰</button>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', letterSpacing: '-.01em' }}>{title}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', padding: '4px 10px', background: 'var(--surface2)', borderRadius: 20, border: '1px solid var(--border)' }}>
          🏢 Cluster Company
        </div>
      </div>
    </header>
  );
}
