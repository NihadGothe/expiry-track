import { getAlertHistory } from '@/lib/db';

export default async function NotificationsPage() {
  const logs = await getAlertHistory() as any[];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', marginBottom: 2 }}>Alert History</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>All Telegram notifications sent by ExpiryTrack</p>
      </div>

      {logs.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-icon">📭</div>
            <h3>No alerts sent yet</h3>
            <p>Alerts appear here once services near expiry.<br />Make sure Telegram is configured in Settings.</p>
          </div>
        </div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead><tr>{['Service','Vendor','Expiry Date','Alert','Sent At'].map(h => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l._id}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{l.service_name}</td>
                  <td style={{ color: 'var(--text2)', fontSize: 13 }}>{l.vendor || '—'}</td>
                  <td style={{ fontSize: 13 }}>{l.expiry_date}</td>
                  <td>
                    <span style={{ background: '#fffbeb', color: '#92400e', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                      {l.days_before}d before
                    </span>
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: 12 }}>{new Date(l.sent_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
