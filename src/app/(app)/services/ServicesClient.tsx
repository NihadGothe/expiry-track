'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useTransition, useCallback, useEffect } from 'react';

export default function ServicesClient({ result, stats, page, search, filter, role }: any) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(search);
  const isAdmin = role === 'admin';
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localServices, setLocalServices] = useState(result.data);
  const [localStats, setLocalStats] = useState(stats);
  const [success, setSuccess] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync when server data changes (fixes search not updating table)
  useEffect(() => { setLocalServices(result.data); }, [result.data]);
  useEffect(() => { setLocalStats(stats); }, [stats]);
  useEffect(() => { setQ(search); }, [search]);

  const { total, totalPages } = result;

  function go(params: Record<string, any>) {
    const sp = new URLSearchParams({
      page: String(page), search: search || '', filter: filter || 'all', ...params,
    });
    startTransition(() => router.push(`/services?${sp.toString()}`));
  }

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?\n\nThis cannot be undone.`)) return;

    // Optimistic remove immediately
    setLocalServices((prev: any[]) => prev.filter(s => (s._id || s.id) !== id));
    setDeletingId(id);
    setErrorMsg('');

    try {
      const r = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        // Rollback
        setLocalServices(result.data);
        setErrorMsg(d.error || 'Delete failed. Please try again.');
      } else {
        setSuccess(`"${name}" deleted successfully`);
        setTimeout(() => setSuccess(''), 3000);
        startTransition(() => router.refresh());
      }
    } catch {
      setLocalServices(result.data);
      setErrorMsg('Network error. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }, [result.data, router]);

  const daysColor = (d: number) =>
    d < 0 ? '#dc2626' : d <= 7 ? '#dc2626' : d <= 15 ? '#d97706' : d <= 30 ? '#ca8a04' : '#059669';


  async function exportToExcel() {
  const r = await fetch(`/api/services?limit=1000&filter=${filter}&search=${search}`);
  const d = await r.json();
  const rows = d.data || [];

  const headers = ['#','Service','Type','Vendor','Purchase Date','Expiry Date','Days Left','Cost','Currency','Card Expiry','Status','Website','Notes','Remarks'];
  const data = rows.map((s: any, i: number) => [
    i+1, s.name, s.type, s.vendor||'', s.purchase_date||'',
    s.expiry_date||'', s.days_left, s.cost||'', s.currency||'',
    s.card_expiry||'', s.status, s.website||'', s.notes||'', s.remarks||''
  ]);

  const csvContent = [headers, ...data]
    .map(row => row.map((v: any) => `"${String(v).replace(/"/g,'""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expirytrack-${filter}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function handleDuplicate(s: any) {
  const id = s._id || s.id;
  const duplicate = {
    name: s.name + ' (copy ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ')',
    type: s.type,
    vendor: s.vendor,
    expiry_date: s.expiry_date,
    purchase_date: s.purchase_date,
    cost: s.cost,
    currency: s.currency,
    card: s.card,
    card_expiry: s.card_expiry,
    frequency: s.frequency,
    renew: s.renew,
    auto_renewal: s.auto_renewal,
    notes: s.notes,
    remarks: s.remarks,
    website: s.website,
    account_num: s.account_num,
    username: s.username,
    password: s.password,
    registered_email: s.registered_email,
    notify_30: s.notify_30,
    notify_15: s.notify_15,
    notify_7: s.notify_7,
    notify_1: s.notify_1,
  };
  const r = await fetch('/api/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(duplicate),
  });
  if (r.ok) {
    setSuccess(`"${s.name}" duplicated — edit the copy to update the name`);
    setTimeout(() => setSuccess(''), 4000);
    startTransition(() => router.refresh());
  }
}

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-sub">{total} service{total !== 1 ? 's' : ''} tracked</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/services/bulk-upload" className="btn btn-secondary">⬆ Bulk Upload</Link>
          <button className="btn btn-secondary" onClick={exportToExcel}>⬇ Export CSV</button>
          <Link href="/services/add" className="btn btn-primary">+ Add Service</Link>
        </div>
      </div>

      {/* Alerts */}
      {success  && <div className="alert alert-success animate-in" style={{ marginBottom: 16 }}>✅ {success}</div>}
      {errorMsg && <div className="alert alert-error   animate-in" style={{ marginBottom: 16 }}>⚠️ {errorMsg} <button onClick={() => setErrorMsg('')} style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>×</button></div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 }}>
        {[
          { label: 'Total',    value: localStats.total,    color: 'var(--text)',  bg: 'var(--surface)', f: 'all'      },
          { label: 'Active',   value: localStats.active,   color: '#059669',      bg: '#f0fdf4',        f: 'active'   },
          { label: 'Expiring', value: localStats.expiring, color: '#d97706',      bg: '#fffbeb',        f: 'expiring' },
          { label: 'Expired',  value: localStats.expired,  color: '#dc2626',      bg: '#fef2f2',        f: 'expired'  },
        ].map(s => (
          <div key={s.label} className="card stat-card"
            style={{ background: s.bg, cursor: 'pointer', transition: 'all .15s', borderLeft: filter === s.f ? `3px solid ${s.color}` : '3px solid transparent' }}
            onClick={() => go({ filter: s.f, page: '1' })}>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label} Services</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <form onSubmit={e => { e.preventDefault(); go({ search: q, page: '1' }); }}
          style={{ display: 'flex', gap: 8, flex: 1, minWidth: 200 }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="🔍  Search name, vendor, type…"
            style={{ maxWidth: 300, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
          />
          <button type="submit" className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: 13 }}>Search</button>
          {search && (
            <button type="button" className="btn btn-ghost" style={{ fontSize: 13 }}
              onClick={() => { setQ(''); go({ search: '', page: '1' }); }}>
              Clear ×
            </button>
          )}
        </form>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['all','All'],['active','Active'],['expiring','Expiring'],['expired','Expired']].map(([f, l]) => (
            <button key={f} onClick={() => go({ filter: f, page: '1' })} style={{
              padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500,
              cursor: 'pointer', border: '1px solid',
              background: filter === f ? 'var(--brand)' : 'var(--surface)',
              color: filter === f ? '#fff' : 'var(--text2)',
              borderColor: filter === f ? 'var(--brand)' : 'var(--border)',
              transition: 'all .15s',
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card table-wrap" style={{ marginBottom: 16 }}>
        {localServices.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📭</div>
            <h3>No services found</h3>
            <p>{search ? `No results for "${search}"` : 'Add your first service to get started'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>Service</th>
                <th className="hide-mobile">Type</th>
                <th className="hide-mobile" style={{ display: 'none' }}>Purchase Date</th>
                <th className="hide-mobile" style={{ display: 'none' }}>Card Expiry</th>
                <th>Vendor</th>
                <th>Expiry</th>
                <th>Days Left</th>
                <th className="hide-mobile">Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {localServices.map((s: any, i: number) => {
                const id = s._id || s.id;
                const isDeleting = deletingId === id;
                return (
                  <tr key={id} style={{ opacity: isDeleting ? .3 : 1, transition: 'opacity .2s', pointerEvents: isDeleting ? 'none' : 'auto' }}>
                    <td style={{ color: 'var(--text3)', fontSize: 12 }}>{(page-1)*20+i+1}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                      {s.website && (
                        <a href={s.website} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, color: 'var(--brand)', textDecoration: 'none' }}
                          onClick={e => e.stopPropagation()}>
                          {s.website.replace(/^https?:\/\//, '').split('/')[0]}
                        </a>
                      )}
                    </td>
                    <td className="hide-mobile"><span className="chip">{s.type || '—'}</span></td>
                    <td style={{ display: 'none' }}>{s.purchase_date || '—'}</td>
                    <td style={{ display: 'none' }}>{s.card_expiry || '—'}</td>
                    <td style={{ color: 'var(--text2)', fontSize: 13, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.vendor ? s.vendor.replace(/^https?:\/\//, '').split('/')[0] : '—'}
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{s.expiry_date || '—'}</td>
                    <td>
                      {s.expiry_date ? (
                        <span style={{ fontWeight: 700, fontSize: 13, color: daysColor(s.days_left) }}>
                          {s.days_left < 0 ? `${Math.abs(s.days_left)}d ago` : s.days_left === 0 ? 'TODAY!' : `${s.days_left}d`}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="hide-mobile" style={{ color: 'var(--text2)', fontSize: 13 }}>
                      {s.cost ? `${s.currency || 'USD'} ${Number(s.cost).toLocaleString()}` : '—'}
                    </td>
                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 5 }}>
                        <Link href={`/services/${id}`} className="btn btn-ghost btn-sm">View</Link>
                        {isAdmin && <Link href={`/services/${id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>}
                        {isAdmin && <button
                          className="btn btn-danger btn-sm"
                          disabled={isDeleting}
                          onClick={() => handleDelete(id, s.name)}
                        >
                          {isDeleting ? '⏳' : 'Del'}
                        </button>}
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDuplicate(s)} title="Duplicate">⧉</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>
            Showing {Math.min((page-1)*20+1, total)}–{Math.min(page*20, total)} of {total}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-secondary btn-sm" disabled={page<=1} onClick={() => go({ page: String(page-1) })}>← Prev</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page-2+i, totalPages-4+i));
              return (
                <button key={p} onClick={() => go({ page: String(p) })} style={{
                  padding: '5px 10px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', border: '1px solid',
                  background: p === page ? 'var(--brand)' : 'var(--surface)',
                  color: p === page ? '#fff' : 'var(--text2)',
                  borderColor: p === page ? 'var(--brand)' : 'var(--border)',
                }}>{p}</button>
              );
            })}
            <button className="btn btn-secondary btn-sm" disabled={page>=totalPages} onClick={() => go({ page: String(page+1) })}>Next →</button>
          </div>
        </div>
      )}
    </>
  );
}