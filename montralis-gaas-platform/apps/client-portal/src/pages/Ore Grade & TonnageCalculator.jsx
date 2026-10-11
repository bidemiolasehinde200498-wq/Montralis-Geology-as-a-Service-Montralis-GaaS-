import React, { useState } from 'react';

const DENSITY_T_PER_M3 = 2.7;

// Heuristic pre-drilling estimate; not a JORC/NI 43-101 resource figure.
function estimate({ areaHa, density, reflectance, dip }) {
  const thickness = Math.max(1, 60 * density * Math.cos((dip * Math.PI) / 180));
  const grade = Math.min(100, reflectance * density * 8);
  const tonnage = areaHa * 10000 * thickness * DENSITY_T_PER_M3;
  return { thickness, grade, tonnage };
}

export default function Calculator() {
  const [v, setV] = useState({ areaHa: 50, density: 0.6, reflectance: 0.5, dip: 20 });
  const set = (k) => (e) => setV({ ...v, [k]: Math.max(0, parseFloat(e.target.value) || 0) });
  const out = estimate(v);

  const input = (k, label, step) => (
    <div>
      <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">{label}</label>
      <input type="number" step={step} value={v[k]} onChange={set(k)}
        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 focus:border-emerald-500 outline-none" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Ore Grade & Tonnage Calculator</h2>
        <p className="text-sm text-slate-400">Pre-drilling estimate of deposit thickness, purity and tonnage.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
        {input('areaHa', 'Anomaly area (ha)', 1)}
        {input('density', 'Pixel density (0-1)', 0.05)}
        {input('reflectance', 'Reflectance (0-1)', 0.05)}
        {input('dip', 'Structural dip (deg)', 1)}
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-slate-950 border border-slate-800 rounded p-4">
          <p className="text-xs text-slate-500">Thickness</p>
          <p className="text-xl font-bold text-emerald-400">{out.thickness.toFixed(1)} m</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded p-4">
          <p className="text-xs text-slate-500">Purity</p>
          <p className="text-xl font-bold text-emerald-400">{out.grade.toFixed(1)} %</p>
        </div>
        <div className="bg-slate-950 border border-slate-800 rounded p-4">
          <p className="text-xs text-slate-500">Tonnage</p>
          <p className="text-xl font-bold text-emerald-400">{Math.round(out.tonnage).toLocaleString()} t</p>
        </div>
      </div>
      <p className="text-xs text-amber-400">Heuristic estimate only; confirm with drilling before any commercial use.</p>
    </div>
  );
}
