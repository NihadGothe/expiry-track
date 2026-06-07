'use client';
import { useState, useEffect, useCallback } from 'react';

type User = { _id: string; name: string; email: string; role: string; created_at: string; };
type ModalMode = 'add' | 'edit' | null;

const EMPTY_FORM = { name: '', email: '', password: '', role: 'viewer' };

export default function UsersPage() {
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [mode, setMode]         = useState<ModalMode>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm]         = useState({ ...EMPTY_FORM });
  const [saving, setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  // ── Load ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/users');
    if (r.ok) setUsers(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Open modals ─────────────────────────────────────────────────────────
  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setEditUser(null);
    setError('');
    setMode('add');
  }

  function openEdit(u: User) {
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setEditUser(u);
    setError('');
    setMode('edit');
  }

  function closeModal() {
    // Only close via this function — never from outside state
    setMode(null);
    setError('');
    setEditUser(null);
    setForm({ ...EMPTY_FORM });
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();        // prevent any form default
    e.stopPropagation();
    if (!form.name.trim())  { setError('Full name is required'); return; }
    if (!form.email.trim()) { setError('Email is required'); return; }
    if (mode === 'add' && form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setSaving(true); setError('');
    try {
      const url    = mode === 'edit' ? `/api/users/${editUser!._id}` : '/api/users';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const body   = mode === 'edit'
        ? { name: form.name, role: form.role, ...(form.password ? { password: form.password } : {}) }
        : form;

      const r = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const d = await r.json();

      if (!r.ok) { setError(d.error || 'Operation failed'); return; }

      // Success — close THEN reload
      closeModal();
      setSuccess(mode === 'edit' ? 'User updated successfully' : 'User added successfully');
      await load();
      setTimeout(() => setSuccess(''), 4000);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete (fixed: immediate, no double-click) ──────────────────────────
  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      // Optimistic update — remove immediately from state
      setUsers(prev => prev.filter(u => u._id !== id));
      setSuccess('User deleted');
      setTimeout(() => setSuccess(''), 3000);
    } finally {
      setDeletingId(null);
    }
  }

  const upd = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-sub">Manage team members and their access levels</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add User</button>
      </div>

      {/* Success banner */}
      {success && (
        <div className="alert alert-success animate-in" style={{ marginBottom: 18 }}>
          ✅ {success}
        </div>
      )}

      {/* Table */}
      <div className="card table-wrap">
        {loading ? (
          <div className="empty"><p style={{ color: 'var(--text3)' }}>Loading users…</p></div>
        ) : users.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">👥</div>
            <h3>No users yet</h3>
            <p>Add your first team member to get started</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                {['User', 'Email', 'Role', 'Created', 'Actions'].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: u.role === 'admin' ? 'var(--brand-light)' : '#f0fdf4',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 13, flexShrink: 0,
                        color: u.role === 'admin' ? 'var(--brand)' : '#059669',
                        border: `1px solid ${u.role === 'admin' ? 'var(--brand-mid)' : '#a7f3d0'}`,
                      }}>
                        {u.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text2)', fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span className={`badge role-${u.role}`}>
                      {u.role === 'admin' ? '🔑 Admin' : '👁 Viewer'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: 12 }}>
                    {new Date(u.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>✏ Edit</button>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={deletingId === u._id}
                        onClick={() => handleDelete(u._id, u.name)}
                      >
                        {deletingId === u._id ? '⏳' : '🗑 Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats bar */}
      <div style={{ marginTop: 14, display: 'flex', gap: 16, fontSize: 12, color: 'var(--text3)' }}>
        <span>{users.length} total users</span>
        <span>·</span>
        <span>{users.filter(u => u.role === 'admin').length} admins</span>
        <span>·</span>
        <span>{users.filter(u => u.role === 'viewer').length} viewers</span>
      </div>

      {/* ── Modal (Add / Edit) ──────────────────────────────────────────── */}
      {mode && (
        <div
          className="modal-overlay"
          // CRITICAL FIX: Do NOT close on overlay click to prevent accidental close
          // Only close buttons trigger closeModal()
        >
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontWeight: 700, fontSize: 17, marginBottom: 2 }}>
                  {mode === 'add' ? '➕ Add New User' : `✏️ Edit User — ${editUser?.name}`}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {mode === 'add' ? 'Create a new team member account' : 'Update user details and permissions'}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={closeModal}
                style={{ fontSize: 20, lineHeight: 1 }}
                aria-label="Close"
              >×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-error" style={{ marginBottom: 16 }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'grid', gap: 16 }}>
                  {/* Name */}
                  <div className="field">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => upd('name', e.target.value)}
                      placeholder="e.g. John Smith"
                      required
                      autoFocus
                    />
                  </div>

                  {/* Email */}
                  <div className="field">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => upd('email', e.target.value)}
                      placeholder="john@cluster.com.qa"
                      required
                      readOnly={mode === 'edit'} // Email cannot be changed on edit
                    />
                    {mode === 'edit' && <span className="field-hint">Email cannot be changed after creation</span>}
                  </div>

                  {/* Password */}
                  <div className="field">
                    <label>{mode === 'add' ? 'Password *' : 'New Password'}</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => upd('password', e.target.value)}
                      placeholder={mode === 'add' ? 'Minimum 6 characters' : 'Leave blank to keep current password'}
                      required={mode === 'add'}
                      minLength={mode === 'add' ? 6 : undefined}
                    />
                    {mode === 'edit' && <span className="field-hint">Only fill this if you want to change the password</span>}
                  </div>

                  {/* Role */}
                  <div className="field">
                    <label>Access Role *</label>
                    <select value={form.role} onChange={e => upd('role', e.target.value)}>
                      <option value="admin">🔑 Admin — Full access (add, edit, delete)</option>
                      <option value="viewer">👁 Viewer — Read only access</option>
                    </select>
                  </div>

                  {/* Role info box */}
                  <div style={{
                    padding: '12px 14px', borderRadius: 8,
                    background: form.role === 'admin' ? 'var(--brand-light)' : '#f0fdf4',
                    border: `1px solid ${form.role === 'admin' ? 'var(--brand-mid)' : '#a7f3d0'}`,
                    fontSize: 12,
                    color: form.role === 'admin' ? 'var(--brand-dark)' : '#065f46',
                  }}>
                    {form.role === 'admin'
                      ? '🔑 Admin can: manage all services, users, settings, and receive all notifications.'
                      : '👁 Viewer can: view all services and alerts. Cannot add, edit, or delete.'}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                  style={{ minWidth: 140 }}
                >
                  {saving ? '⏳ Saving…' : mode === 'add' ? '✅ Add User' : '✅ Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
