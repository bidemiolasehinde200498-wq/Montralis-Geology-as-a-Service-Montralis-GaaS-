import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';

export default function TargetQueue() {
  const { logout } = useAuth();
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/v1/gaas/discoveries')
      .then(setRows)
      .catch((err) => (err.status === 401 ? logout() : setError('Unable to load targets.')));
  }, [logout]);

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold">Subsurface Target Queue</h2>
        <p className="text-sm text-slate-400">Detected anomalies ranked by spectral probability and estimated size.</p>
      </div>
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
      <div className="bg-slate-950 border border-slate-800 rounded-lg divide-y divide-slate-800">
        {rows.length === 0 && <p className="p-4 text-sm text-slate-500">No targets yet. Run a scan from the dashboard.</p>}
        {rows.map((r, i) => (
          <div key={r.id} className="p-4 flex justify-between text-sm">
            <span>
              Target #{String(i + 1).padStart(4, '0')} - {r.mineral_target} - {r.country}
            </span>
            <span className="text-emerald-400">
              {r.spectral_confidence}% Confidence | {r.estimated_tonnage}t
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
