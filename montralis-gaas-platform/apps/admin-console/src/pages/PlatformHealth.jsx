import React, { useEffect, useState } from 'react';
import { api } from '../api';

const SERVICES = [
  ['Auth Hub (:8050)', '/api/v1/auth/health'],
  ['Spectral Engine (:9000)', '/api/v1/gaas/health'],
  ['Portal Record Vault (:9000)', '/api/v1/portal/health']
];

export default function PlatformHealth() {
  const [status, setStatus] = useState({});
  const [checkedAt, setCheckedAt] = useState(null);

  useEffect(() => {
    const check = async () => {
      const results = await Promise.all(
        SERVICES.map(([name, url]) => api(url).then(() => [name, true]).catch(() => [name, false]))
      );
      setStatus(Object.fromEntries(results));
      setCheckedAt(new Date());
    };
    check();
    const timer = setInterval(check, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-xl font-bold">Platform Health Logs</h2>
      <p className="text-xs text-slate-400">
        Live service probes, refreshed every 15s{checkedAt && ` (last: ${checkedAt.toLocaleTimeString()})`}.
      </p>
      <div className="bg-slate-950 border border-slate-800 p-4 rounded font-mono text-xs space-y-1">
        {SERVICES.map(([name]) => (
          <p key={name} className={status[name] ? 'text-emerald-500' : 'text-rose-500'}>
            [{status[name] === undefined ? 'CHECKING' : status[name] ? 'SYSTEM_OK' : 'DOWN'}] {name}
          </p>
        ))}
      </div>
    </div>
  );
}
