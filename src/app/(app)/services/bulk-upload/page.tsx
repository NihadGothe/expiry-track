'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Your exact KeePass column headers (case-insensitive matching)
const COLUMN_MAP: Record<string, string> = {
  'sno': 'sno', 's.no': 'sno', 'no': 'sno', '#': 'sno',
  'item': 'name', 'name': 'name', 'service': 'name', 'service name': 'name',
  'status': 'item_status',
  'purchase date': 'purchase_date', 'purchasedate': 'purchase_date', 'purchase': 'purchase_date',
  'expiry': 'expiry_date', 'expiry date': 'expiry_date', 'expirydate': 'expiry_date', 'expiry/renewal date': 'expiry_date',
  'frequency': 'frequency',
  'renew': 'renew',
  'value in $': 'cost', 'value': 'cost', 'cost': 'cost', 'amount': 'cost', 'price': 'cost',
  'card': 'card',
  'card expiry': 'card_expiry', 'card exp': 'card_expiry',
  'provider': 'vendor', 'vendor': 'vendor',
  'username': 'username', 'user': 'username', 'user name': 'username',
  'password': 'password', 'pass': 'password',
  'registered email': 'registered_email', 'email': 'registered_email', 'registeredemail': 'registered_email',
  'remarks': 'remarks', 'notes': 'notes',
  'type': 'type',
  'website': 'website', 'url': 'website',
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  for (const line of lines) {
    const cols: string[] = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') { inQ = !inQ; }
      else if (c === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else cur += c;
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

function parseExcelDate(val: string): string {
  if (!val) return '';
  // Already in YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.split('T')[0];
  // DD/MM/YYYY or MM/DD/YYYY
  if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(val)) {
    const parts = val.split('/');
    if (parts[2]?.length === 4) {
      // Try DD/MM/YYYY
      const d = new Date(`${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    }
    // Try MM/DD/YYYY
    const d2 = new Date(val);
    if (!isNaN(d2.getTime())) return d2.toISOString().split('T')[0];
  }
  // Excel serial number
  const num = Number(val);
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const d = new Date((num - 25569) * 86400 * 1000);
    return d.toISOString().split('T')[0];
  }
  // Try any date string
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return val;
}

export default function BulkUploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number; total: number } | null>(null);
  const [error, setError] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(''); setResult(null); setPreview([]);

    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv' || ext === 'txt') {
      const text = await file.text();
      processRows(parseCSV(text));
    } else if (ext === 'xlsx' || ext === 'xls') {
      // Read xlsx using dynamic import
      try {
        const ab = await file.arrayBuffer();
        const XLSX = await import('xlsx');
        const wb = XLSX.read(ab, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'YYYY-MM-DD' });
        processRows(rows as string[][]);
      } catch {
        setError('Could not read Excel file. Try saving as CSV and uploading that.');
      }
    } else {
      setError('Please upload a .xlsx, .xls, or .csv file');
    }
  }

  function processRows(rows: string[][]) {
    if (rows.length < 2) { setError('File appears empty'); return; }

    // Map headers
    const rawHeaders = rows[0].map(h => h.toString().toLowerCase().trim());
    const mappedKeys = rawHeaders.map(h => COLUMN_MAP[h] || h);
    setHeaders(rawHeaders);

    const records = rows.slice(1).filter(r => r.some(c => c?.toString().trim())).map(row => {
      const obj: Record<string, any> = {};
      mappedKeys.forEach((key, i) => {
        let val = row[i]?.toString().trim() || '';
        // Parse date fields
        if (key === 'expiry_date' || key === 'purchase_date') val = parseExcelDate(val);
        // Parse cost
        if (key === 'cost') val = val.replace(/[^0-9.]/g, '') || '';
        obj[key] = val;
      });
      // Defaults
      if (!obj.type) obj.type = 'Other';
      if (!obj.currency) obj.currency = 'USD';
      obj.notify_30 = true; obj.notify_15 = true; obj.notify_7 = true; obj.notify_1 = true;
      return obj;
    });

    setPreview(records);
  }

  async function doUpload() {
    if (!preview.length) return;
    setUploading(true); setError('');
    const r = await fetch('/api/bulk-upload', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ services: preview }),
    });
    const d = await r.json();
    setUploading(false);
    if (r.ok) setResult({ imported: d.imported, total: preview.length });
    else setError(d.error || 'Upload failed');
  }

  function downloadTemplate() {
    const headers = 'S.NO,Item,Status,Purchase Date,Expiry,Frequency,Renew,Value in $,Card,Card Expiry,Provider,Username,Password,Registered Email,Remarks';
    const sample = '1,company.com,Active,2024-01-15,2025-01-15,Yearly,Yes,15,Visa *1234,12/26,GoDaddy,admin,pass123,admin@company.com,Main domain';
    const blob = new Blob([headers + '\n' + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'expirytrack-template.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:28 }}>
        <Link href="/services" style={{ color:'var(--text2)',textDecoration:'none',fontSize:20 }}>←</Link>
        <div>
          <h1 style={{ fontSize:22,fontWeight:700,letterSpacing:'-.02em' }}>Bulk Upload Services</h1>
          <p style={{ color:'var(--text2)',fontSize:13 }}>Upload Excel or CSV — matches your KeePass export format</p>
        </div>
      </div>

      {result ? (
        // Success state
        <div className="card" style={{ padding:40,textAlign:'center' }}>
          <div style={{ fontSize:48,marginBottom:16 }}>✅</div>
          <h2 style={{ fontSize:22,fontWeight:700,marginBottom:8 }}>Upload Complete!</h2>
          <p style={{ color:'var(--text2)',fontSize:15,marginBottom:24 }}>
            Successfully imported <strong>{result.imported}</strong> out of <strong>{result.total}</strong> services.
          </p>
          <div style={{ display:'flex',gap:12,justifyContent:'center' }}>
            <button className="btn btn-secondary" onClick={() => { setResult(null); setPreview([]); setFileName(''); if (fileRef.current) fileRef.current.value = ''; }}>Upload More</button>
            <Link href="/services" className="btn btn-primary">View Services →</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Upload zone */}
          <div className="card" style={{ marginBottom:20,padding:28 }}>
            <div style={{ display:'flex',gap:16,flexWrap:'wrap',marginBottom:20 }}>
              <div>
                <p style={{ fontWeight:600,fontSize:14,marginBottom:4 }}>Supported columns (matches your KeePass export):</p>
                <p style={{ fontSize:12,color:'var(--text2)',lineHeight:1.8 }}>
                  S.NO · Item · Status · Purchase Date · Expiry · Frequency · Renew · Value in $ · Card · Card Expiry · Provider · Username · Password · Registered Email · Remarks
                </p>
                <p style={{ fontSize:12,color:'var(--text3)',marginTop:6 }}>
                  ✅ No validation — all rows are imported as-is. Extra or missing columns are handled automatically.
                </p>
              </div>
              <button className="btn btn-secondary" style={{ alignSelf:'flex-start',flexShrink:0 }} onClick={downloadTemplate}>
                ⬇ Download Template
              </button>
            </div>

            {/* Drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border:'2px dashed var(--border2)',borderRadius:12,padding:'36px 20px',textAlign:'center',cursor:'pointer',background:'var(--surface2)',transition:'all .15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor='var(--blue)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor='var(--border2)')}
            >
              <div style={{ fontSize:36,marginBottom:10 }}>📂</div>
              <p style={{ fontWeight:600,fontSize:15,marginBottom:4 }}>{fileName || 'Click to choose file'}</p>
              <p style={{ color:'var(--text2)',fontSize:13 }}>Excel (.xlsx, .xls) or CSV (.csv)</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.txt" onChange={handleFile} style={{ display:'none' }} />
            </div>

            {error && <div className="alert alert-error" style={{ marginTop:14 }}>{error}</div>}
          </div>

          {/* Preview table */}
          {preview.length > 0 && (
            <div className="card" style={{ marginBottom:20 }}>
              <div className="card-header">
                <div>
                  <h3 style={{ fontWeight:700,fontSize:15 }}>Preview — {preview.length} rows found</h3>
                  <p style={{ color:'var(--text2)',fontSize:12,marginTop:2 }}>Review before importing. All rows will be imported as shown.</p>
                </div>
                <button className="btn btn-primary" onClick={doUpload} disabled={uploading} style={{ minWidth:140 }}>
                  {uploading ? 'Importing…' : `Import ${preview.length} Services`}
                </button>
              </div>
              <div style={{ overflowX:'auto',maxHeight:480,overflowY:'auto' }}>
                <table>
                  <thead style={{ position:'sticky',top:0,background:'var(--surface2)',zIndex:1 }}>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Vendor</th>
                      <th>Expiry</th>
                      <th>Cost</th>
                      <th>Status</th>
                      <th>Email</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        <td style={{ color:'var(--text3)',fontSize:12 }}>{i+1}</td>
                        <td style={{ fontWeight:500,fontSize:13 }}>{row.name || row.item || '—'}</td>
                        <td><span className="chip">{row.type || '—'}</span></td>
                        <td style={{ color:'var(--text2)',fontSize:13 }}>{row.vendor || '—'}</td>
                        <td style={{ fontSize:13 }}>{row.expiry_date || '—'}</td>
                        <td style={{ fontSize:13 }}>{row.cost ? `$${row.cost}` : '—'}</td>
                        <td style={{ fontSize:12,color:'var(--text2)' }}>{row.item_status || '—'}</td>
                        <td style={{ fontSize:12,color:'var(--text2)' }}>{row.registered_email || '—'}</td>
                        <td style={{ fontSize:12,color:'var(--text2)',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{row.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
