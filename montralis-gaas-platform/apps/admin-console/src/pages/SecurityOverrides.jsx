import React, { useState } from 'react';

const RULES = ['Zimbabwe mineral data localisation', 'Zambia resource nationalism boundary', 'DRC export data residency'];

export default function SecurityOverrides() {
  const [enabled, setEnabled] = useState(() => Object.fromEntries(RULES.map((r) => [r, true])));
  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-xl font-bold">Security Overrides: Data Localisation Rules</h2>
      <p className="text-xs text-amber-400">Preview only: toggles are not persisted or enforced by any service yet.</p>
      <div className="bg-slate-950 border border-slate-800 rounded divide-y divide-slate-800">
        {RULES.map((r) => (
          <label key={r} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{r}</span>
            <input type="checkbox" checked={enabled[r]} onChange={(e) => setEnabled({ ...enabled, [r]: e.target.checked })} />
          </label>
        ))}
      </div>
    </div>
  );
}
