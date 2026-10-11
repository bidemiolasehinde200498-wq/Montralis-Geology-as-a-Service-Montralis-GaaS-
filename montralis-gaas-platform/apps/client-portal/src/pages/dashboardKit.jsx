import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';


export const DASHBOARDS = [
 { id: 'dash-exploration', label: 'Mineral Exploration AI', audience: 'Chief Geologists / Exploration Executives' },
 { id: 'dash-tailings', label: 'Tailings Dam Environmental Risk', audience: 'Compliance Officers / Insurance Underwriters' },
 { id: 'dash-utility', label: 'Energy Infrastructure Geohazards', audience: 'Grid Ops Directors / Pipeline Engineers' }
];


export const fieldClass = 'w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none';


export function DashboardSwitcher({ current, onSwitch }) {
 return (
   <nav aria-label="Dashboard switcher" className="flex flex-wrap gap-2 rounded-lg border border-slate-800 bg-slate-950 p-1.5">
     {DASHBOARDS.map((dashboard) => (
       <button
         key={dashboard.id}
         type="button"
         onClick={() => onSwitch(dashboard.id)}
         aria-current={current === dashboard.id ? 'page' : undefined}
         title={`For ${dashboard.audience}`}
         className={`flex-1 min-w-[190px] rounded px-4 py-2 text-left transition ${current === dashboard.id ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-900'}`}
       >
         <span className="block text-sm font-semibold">{dashboard.label}</span>
         <span className={`block text-[11px] ${current === dashboard.id ? 'text-slate-800' : 'text-slate-500'}`}>{dashboard.audience}</span>
       </button>
     ))}
   </nav>
 );
}


export function useDashboardData(path, intervalMs = 0) {
 const { logout } = useAuth();
 const [data, setData] = useState(null);
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(true);


 const refresh = useCallback(async () => {
   try {
     setData(await api(path));
     setError('');
   } catch (err) {
     if (err.status === 401) logout();
     else setError(err.status === 403 ? 'Your account does not have access to this dashboard.' : err.message || 'Could not load dashboard data.');
   } finally {
     setLoading(false);
   }
 }, [path, logout]);


 useEffect(() => { refresh(); }, [refresh]);
 useEffect(() => {
   if (!intervalMs) return undefined;
   const timer = setInterval(refresh, intervalMs);
   return () => clearInterval(timer);
 }, [refresh, intervalMs]);
 return { data, error, loading, refresh };
}


export function parsePoints(text, minimum) {
 const points = text.split(';').map((pair) => pair.trim()).filter(Boolean).map((pair) => {
   const [lat, lng] = pair.split(',').map((part) => Number(part.trim()));
   if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
     throw new Error(`"${pair}" is not a valid "latitude, longitude" pair.`);
   }
   return [lat, lng];
 });
 if (points.length < minimum) throw new Error(`Enter at least ${minimum} "latitude, longitude" pairs separated by semicolons.`);
 return points;
}


export function QuickForm({ title, collection, fields, transform, onSaved, submitLabel = 'Save', hint }) {
 const { logout } = useAuth();
 const initial = () => Object.fromEntries(fields.map((f) => [f.name, f.defaultValue || (f.options ? f.options[0] : '')]));
 const [values, setValues] = useState(initial);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [message, setMessage] = useState('');


 const submit = async (event) => {
   event.preventDefault();
   setBusy(true);
   setError('');
   setMessage('');
   try {
     const body = transform ? transform(values) : values;
     const saved = await api(`/api/v1/portal/${collection}`, { method: 'POST', body: JSON.stringify(body) });
     setValues(initial());
     setMessage('Saved.');
     if (onSaved) onSaved(saved);
   } catch (err) {
     if (err.status === 401) logout();
     else setError(err.message || 'Could not save this record.');
   } finally {
     setBusy(false);
   }
 };


 return (
   <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
     <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
     {hint && <p className="text-xs text-slate-500">{hint}</p>}
     <div className="grid gap-3 sm:grid-cols-2">
       {fields.map((f) => (
         <label key={f.name} className={`block space-y-1 ${f.wide ? 'sm:col-span-2' : ''}`}>
           <span className="text-[11px] font-semibold uppercase text-slate-500">{f.label}</span>
           {f.options ? (
             <select required={f.required !== false} value={values[f.name]} className={fieldClass}
               onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}>
               {f.options.map((option) => <option key={option} value={option}>{option}</option>)}
             </select>
           ) : (
             <input required={f.required !== false} type={f.type || 'text'} min={f.min} max={f.max} step={f.step}
               placeholder={f.placeholder} value={values[f.name]} className={fieldClass}
               onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
           )}
         </label>
       ))}
     </div>
     {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
     {message && <p role="status" className="text-sm text-emerald-400">{message}</p>}
     <button disabled={busy} className="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:bg-slate-700">
       {busy ? 'Saving…' : submitLabel}
     </button>
   </form>
 );
}


const STATUS_COLOR = { Normal: '#34d399', Warning: '#f59e0b', Critical: '#f43f5e', 'No data': '#64748b' };
export const statusColor = (status) => STATUS_COLOR[status] || STATUS_COLOR['No data'];


/** Semicircular gauge. fraction is 0..1; thresholds at 0.5 (warning) and 1.0 (critical) of the axis supplied by the caller. */
export function Gauge({ fraction, status, valueText, caption, size = 180 }) {
 const clamped = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;
 const cx = 100;
 const cy = 100;
 const radius = 80;
 const point = (f) => {
   const angle = Math.PI * (1 - f);
   return [cx + radius * Math.cos(angle), cy - radius * Math.sin(angle)];
 };
 const arc = (from, to) => {
   const [x1, y1] = point(from);
   const [x2, y2] = point(to);
   return `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`;
 };
 const [nx, ny] = point(clamped);
 return (
   <figure className="flex flex-col items-center" aria-label={`${caption}: ${valueText}`}>
     <svg viewBox="0 0 200 118" width={size} role="img">
       <path d={arc(0, 0.5)} stroke="#065f46" strokeWidth="14" fill="none" />
       <path d={arc(0.5, 1)} stroke="#92400e" strokeWidth="14" fill="none" />
       <path d={arc(0, clamped)} stroke={statusColor(status)} strokeWidth="14" fill="none" strokeLinecap="butt" />
       <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" />
       <circle cx={cx} cy={cy} r="6" fill="#e2e8f0" />
       <text x={cx} y={cy + 17} textAnchor="middle" fill="#e2e8f0" fontSize="15" fontWeight="700">{valueText}</text>
     </svg>
     <figcaption className="text-xs text-slate-400">{caption}</figcaption>
   </figure>
 );
}


export function LineChart({ points, refLines = [], unit, color = '#34d399', emptyText = 'No observations recorded.' }) {
 if (!points.length) return <div className="flex h-44 items-center justify-center text-sm text-slate-500">{emptyText}</div>;
 const width = 640;
 const height = 200;
 const margin = 34;
 const values = [...points.map((p) => p.y), ...refLines.map((r) => r.y)];
 const high = Math.max(...values, 0.0001);
 const low = Math.min(...values, 0);
 const span = high - low || 1;
 const getX = (i) => margin + (points.length === 1 ? (width - margin * 2) / 2 : (i * (width - margin * 2)) / (points.length - 1));
 const getY = (v) => margin / 2 + ((high - v) / span) * (height - margin * 1.5);
 const path = points.map((p, i) => `${i ? 'L' : 'M'} ${getX(i)} ${getY(p.y)}`).join(' ');
 return (
   <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label={`Chart in ${unit}`}>
     <line x1={margin} y1={getY(0)} x2={width - margin} y2={getY(0)} stroke="#475569" />
     {refLines.map((line) => (
       <g key={`${line.label}-${line.y}`}>
         <line x1={margin} y1={getY(line.y)} x2={width - margin} y2={getY(line.y)} stroke={line.color || '#f59e0b'} strokeDasharray="5 5" />
         <text x={width - margin} y={getY(line.y) - 4} textAnchor="end" fontSize="10" fill={line.color || '#fbbf24'}>{line.label}</text>
       </g>
     ))}
     <path d={path} fill="none" stroke={color} strokeWidth="2.5" />
     {points.map((p, i) => <circle key={`${p.x}-${i}`} cx={getX(i)} cy={getY(p.y)} r="3.5" fill={p.flag || color}><title>{`${p.x}: ${p.y} ${unit}`}</title></circle>)}
     <text x={margin} y={height - 4} fill="#94a3b8" fontSize="10">{points[0].x}</text>
     <text x={width - margin} y={height - 4} textAnchor="end" fill="#94a3b8" fontSize="10">{points.at(-1).x}</text>
     <text x={4} y={12} fill="#94a3b8" fontSize="10">{unit}</text>
   </svg>
 );
}


export function DashboardHeader({ title, audience, note, children }) {
 return (
   <header className="space-y-2">
     <div>
       <h1 className="text-2xl font-bold">{title}</h1>
       <p className="text-sm text-slate-400">For {audience}</p>
     </div>
     {children}
     {note && <p className="text-xs text-amber-400">{note}</p>}
   </header>
 );
}


export const Panel = ({ title, actions, children, className = '' }) => (
 <section className={`rounded-lg border border-slate-800 bg-slate-950 p-4 ${className}`}>
   {(title || actions) && (
     <div className="mb-3 flex items-center justify-between gap-3">
       {title && <h2 className="text-sm font-semibold text-slate-300">{title}</h2>}
       {actions}
     </div>
   )}
   {children}
 </section>
);
