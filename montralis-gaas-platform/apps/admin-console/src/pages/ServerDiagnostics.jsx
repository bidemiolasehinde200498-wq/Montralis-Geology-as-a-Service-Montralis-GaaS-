import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function ServerDiagnostics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/v1/admin/overview').then(setData).catch(() => setError('Unable to load diagnostics.'));
  }, []);

  if (error) return <p role="alert" className="text-rose-400">{error}</p>;
  if (!data) return <p className="text-slate-500">Loading…</p>;

  const rows = [
    ['Spectral engine', data.spectral_engine],
    ['Uptime', `${Math.floor(data.uptime_seconds / 60)} min`],
    ['Python', data.python_version],
    ['Vault size', `${(data.database_bytes / 1024).toFixed(1)} KB`],
    ['Discoveries logged', data.discoveries_total],
    ...Object.entries(data.discoveries_by_mineral).map(([m, c]) => [`  ${m}`, c]),
    ...Object.entries(data.accounts_by_portal).map(([p, c]) => [`Accounts (${p})`, c])
  ];

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-xl font-bold">Server Diagnostics</h2>
      <dl className="bg-slate-950 border border-slate-800 rounded divide-y divide-slate-800">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between px-4 py-2 text-sm">
            <dt className="text-slate-500 whitespace-pre">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
