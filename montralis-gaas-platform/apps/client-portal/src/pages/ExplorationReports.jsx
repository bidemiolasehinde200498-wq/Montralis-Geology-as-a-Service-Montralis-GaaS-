import React, { useState } from 'react';

export default function ExplorationReports({ countries, minerals, defaultReportType = 'exploration' }) {
  const [reportType, setReportType] = useState(defaultReportType);
  const [country, setCountry] = useState('');
  const [mineral, setMineral] = useState('');
  const [title, setTitle] = useState(`Montralis GaaS ${defaultReportType === 'geotechnical' ? 'Geotechnical' : 'Exploration'} Report`);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const generate = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const response = await fetch('/api/v1/analytics/reports', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ report_type: reportType, title, country: country || null, mineral: mineral || null, password })
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.detail || `Report request failed (${response.status}).`);
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] || 'montralis-report.pdf';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setStatus('Encrypted PDF downloaded. Use the password you entered to open it.');
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const control = 'w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-emerald-500';

  return (
    <div className="max-w-4xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">
          {defaultReportType === 'geotechnical' ? 'Environmental & Geotechnical Report Generator' : 'Exploration & Risk Report Generator'}
        </h1>
        <p className="text-sm text-slate-400">Compile saved exploration discoveries or account-owned geotechnical observations into a password-encrypted PDF.</p>
        <p className="text-xs text-amber-400">Reports summarize recorded inputs; they are not a resource/reserve declaration, engineering certification or safety determination. Password is not stored. Use HTTPS in production.</p>
      </header>
      <form onSubmit={generate} className="space-y-5 rounded-lg border border-slate-800 bg-slate-950 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
            <span>Report type</span>
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className={control}>
              <option value="exploration">Exploration targets</option>
              <option value="geotechnical">Geotechnical observations</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
            <span>Report title</span>
            <input required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} className={control} />
          </label>
          {reportType === 'exploration' && <>
            <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
              <span>Country filter</span>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className={control}>
                <option value="">All indexed countries</option>
                {countries.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
              <span>Target element</span>
              <select value={mineral} onChange={(e) => setMineral(e.target.value)} className={control}>
                <option value="">All target elements</option>
                {minerals.map((item) => <option key={item.symbol} value={item.name}>{item.name} ({item.symbol})</option>)}
              </select>
            </label>
          </>}
          <label className="space-y-1 text-xs font-semibold uppercase text-slate-500 md:col-span-2">
            <span>PDF open password (10+ characters)</span>
            <input required type="password" minLength={10} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={control} />
          </label>
        </div>
        {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
        {status && <p role="status" className="text-sm text-emerald-400">{status}</p>}
        <button disabled={busy || (reportType === 'exploration' && (countries.length === 0 || minerals.length === 0))} className="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:bg-slate-700">
          {busy ? 'Building encrypted report…' : 'Generate encrypted PDF'}
        </button>
      </form>
    </div>
  );
}
