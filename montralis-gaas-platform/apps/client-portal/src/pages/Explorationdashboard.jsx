import React, { useEffect, useMemo, useState } from 'react';
import { CircleMarker, ImageOverlay, MapContainer, Polyline, Popup, Rectangle, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import { MeshCanvas } from './3DStructuralMeshPreview';
import { DashboardHeader, DashboardSwitcher, Panel, QuickForm, fieldClass, parsePoints, useDashboardData } from './dashboardKit';


const FAULT_COLOR = { High: '#f43f5e', Moderate: '#f59e0b', Low: '#a3e635' };


function gridToDataUrl(values) {
 const flat = values.flat().filter((value) => value !== null && Number.isFinite(value));
 if (!flat.length) return null;
 const low = Math.min(...flat);
 const span = Math.max(...flat) - low || 1;
 const canvas = document.createElement('canvas');
 canvas.height = values.length;
 canvas.width = values[0].length;
 const context = canvas.getContext('2d');
 const image = context.createImageData(canvas.width, canvas.height);
 values.forEach((row, r) => row.forEach((value, c) => {
   const offset = (r * canvas.width + c) * 4;
   if (value === null || !Number.isFinite(value)) { image.data[offset + 3] = 0; return; }
   const t = (value - low) / span;
   image.data[offset] = Math.round(255 * t);
   image.data[offset + 1] = Math.round(120 * (1 - Math.abs(t - 0.5) * 2));
   image.data[offset + 2] = Math.round(255 * (1 - t));
   image.data[offset + 3] = 150;
 }));
 context.putImageData(image, 0, 0);
 return canvas.toDataURL();
}


function ZoneController({ zone, pickMode, onPick }) {
 const map = useMap();
 useEffect(() => {
   if (zone) map.fitBounds([[zone[1], zone[0]], [zone[3], zone[2]]], { padding: [20, 20] });
 }, [zone, map]);
 useMapEvents({ click: (event) => { if (pickMode) onPick(event.latlng.lat, event.latlng.lng); } });
 return null;
}


function GridOverlay({ layer }) {
 const url = useMemo(() => gridToDataUrl(layer.values), [layer]);
 if (!url) return null;
 return <ImageOverlay url={url} bounds={[[layer.south, layer.west], [layer.north, layer.east]]} opacity={0.7} />;
}


function Toggle({ checked, onChange, label, disabled, hint }) {
 return (
   <label className={`flex items-center gap-2 text-sm ${disabled ? 'text-slate-600' : 'text-slate-200'}`} title={hint}>
     <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="accent-emerald-500" />
     {label}
   </label>
 );
}


function inZone(zone, lat, lng) {
 return zone && lat >= zone[1] && lat <= zone[3] && lng >= zone[0] && lng <= zone[2];
}


function parseGridCsv(text) {
 const rows = text.trim().split(/\r?\n/).map((line) => line.split(/[,\t;]/).map((cell) => {
   const trimmed = cell.trim();
   if (trimmed === '' || trimmed.toLowerCase() === 'nan' || trimmed.toLowerCase() === 'null') return null;
   const value = Number(trimmed);
   if (!Number.isFinite(value)) throw new Error(`"${trimmed}" is not a number.`);
   return value;
 }));
 if (rows.length < 2 || rows[0].length < 2) throw new Error('The grid needs at least 2 rows and 2 columns.');
 if (rows.length > 128 || rows[0].length > 128) throw new Error('Grids are limited to 128 x 128 cells.');
 if (rows.some((row) => row.length !== rows[0].length)) throw new Error('Every grid row must have the same number of columns.');
 return rows;
}


function GridUpload({ onSaved }) {
 const [file, setFile] = useState(null);
 const [fileError, setFileError] = useState('');
 const [grid, setGrid] = useState(null);


 const onFile = async (event) => {
   const selected = event.target.files?.[0];
   setFile(selected || null);
   setGrid(null);
   setFileError('');
   if (!selected) return;
   if (selected.size > 2_000_000) { setFileError('File is larger than 2 MB.'); return; }
   try { setGrid(parseGridCsv(await selected.text())); } catch (err) { setFileError(err.message); }
 };


 return (
   <div className="space-y-3">
     <label className="block space-y-1">
       <span className="text-[11px] font-semibold uppercase text-slate-500">Grid file (CSV, north row first, blank = no data)</span>
       <input type="file" accept=".csv,.txt" onChange={onFile} className={fieldClass} />
     </label>
     {fileError && <p role="alert" className="text-sm text-rose-400">{fileError}</p>}
     {grid && <p className="text-xs text-emerald-400">{file.name}: {grid.length} rows x {grid[0].length} columns parsed.</p>}
     <QuickForm
       title="Register gravity / magnetic grid"
       collection="geophysics-layers"
       submitLabel="Upload layer"
       hint="Georeferenced survey grid in WGS84. Provide the survey provenance and units so results can be audited."
       fields={[
         { name: 'layer_name', label: 'Layer name' },
         { name: 'layer_type', label: 'Type', options: ['gravity', 'magnetic'], defaultValue: 'gravity' },
         { name: 'west', label: 'West (lng)', type: 'number', step: 'any', min: -180, max: 180 },
         { name: 'east', label: 'East (lng)', type: 'number', step: 'any', min: -180, max: 180 },
         { name: 'south', label: 'South (lat)', type: 'number', step: 'any', min: -90, max: 90 },
         { name: 'north', label: 'North (lat)', type: 'number', step: 'any', min: -90, max: 90 },
         { name: 'units', label: 'Units (e.g. mGal, nT)' },
         { name: 'provenance', label: 'Survey / licence provenance' }
       ]}
       transform={(v) => {
         if (!grid) throw new Error('Choose a valid grid file first.');
         return { ...v, west: Number(v.west), east: Number(v.east), south: Number(v.south), north: Number(v.north), values: grid };
       }}
       onSaved={onSaved}
     />
   </div>
 );
}


function OrderReport({ zone, fee, onOrdered }) {
 const [title, setTitle] = useState('Structural report');
 const [password, setPassword] = useState('');
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [message, setMessage] = useState('');


 const order = async (event) => {
   event.preventDefault();
   setBusy(true);
   setError('');
   setMessage('');
   try {
     const response = await fetch('/api/v1/analytics/reports', {
       method: 'POST',
       credentials: 'same-origin',
       cache: 'no-store',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ report_type: 'structural', title, password, zone_bounds: zone })
     });
     if (!response.ok) {
       const body = await response.json().catch(() => ({}));
       throw new Error(body.detail || `Report request failed (${response.status}).`);
     }
     const blob = await response.blob();
     const name = (response.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'structural-report.pdf';
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = name;
     link.click();
     URL.revokeObjectURL(url);
     setPassword('');
     setMessage(`Encrypted PDF downloaded. A fixed-fee quote of £${fee.toLocaleString()} was recorded; no payment has been taken or invoiced.`);
     onOrdered?.();
   } catch (err) {
     setError(err.message);
   } finally {
     setBusy(false);
   }
 };


 return (
   <form onSubmit={order} className="space-y-3">
     <p className="text-sm text-slate-300">Fixed fee: <strong className="text-emerald-400">£{fee.toLocaleString()}</strong> per 500 sq mile zone report.</p>
     <label className="block space-y-1">
       <span className="text-[11px] font-semibold uppercase text-slate-500">Report title</span>
       <input required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} className={fieldClass} />
     </label>
     <label className="block space-y-1">
       <span className="text-[11px] font-semibold uppercase text-slate-500">PDF open password (10+ characters)</span>
       <input required type="password" minLength={10} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={fieldClass} />
     </label>
     {!zone && <p className="text-xs text-amber-400">Select a 500 sq mile zone on the map first.</p>}
     {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
     {message && <p role="status" className="text-sm text-emerald-400">{message}</p>}
     <button disabled={busy || !zone} className="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:bg-slate-700">
       {busy ? 'Building report…' : `Order structural report — £${fee.toLocaleString()}`}
     </button>
     <p className="text-xs text-slate-500">Compiles targets, your fault lines and grid metadata inside the zone. It is not a resource estimate or engineering certification. Payment collection is not integrated.</p>
   </form>
 );
}


export default function ExplorationDashboard({ onSwitch }) {
 const { data, error, loading, refresh } = useDashboardData('/api/v1/dashboards/exploration');
 const [zone, setZone] = useState(null);
 const [zoneError, setZoneError] = useState('');
 const [pickMode, setPickMode] = useState(false);
 const [show, setShow] = useState({ targets: true, faults: true, gravity: true, magnetic: true });
 const [selectedFault, setSelectedFault] = useState(null);
 const [meshLayers, setMeshLayers] = useState([]);
 const [mesh, setMesh] = useState(null);
 const [meshError, setMeshError] = useState('');
 const [meshBusy, setMeshBusy] = useState(false);


 const gravity = data?.geophysics_layers.filter((layer) => layer.layer_type === 'gravity') || [];
 const magnetic = data?.geophysics_layers.filter((layer) => layer.layer_type === 'magnetic') || [];


 const setZoneAt = async (lat, lng) => {
   setZoneError('');
   try {
     const result = await api(`/api/v1/dashboards/exploration/zone?latitude=${lat}&longitude=${lng}`);
     setZone(result.bounds);
     setPickMode(false);
   } catch (err) {
     setZoneError(err.message);
   }
 };


 const projectMesh = async () => {
   setMeshBusy(true);
   setMeshError('');
   try {
     setMesh(await api('/api/v1/dashboards/exploration/mesh', { method: 'POST', body: JSON.stringify({ layer_ids: meshLayers }) }));
   } catch (err) {
     setMesh(null);
     setMeshError(err.message);
   } finally {
     setMeshBusy(false);
   }
 };


 const zoneTargets = data ? data.discoveries.filter((d) => inZone(zone, d.latitude, d.longitude)) : [];
 const zoneFaults = data ? data.fault_lines.filter((f) => f.points.some(([lat, lng]) => inZone(zone, lat, lng))) : [];


 return (
   <div className="max-w-7xl space-y-6">
     <DashboardHeader
       title="Mineral Exploration AI"
       audience="Chief Geologists and Exploration Executives"
       note="Gravity/magnetic layers, fault lines and the 3D surface use only data you upload; none is bundled or auto-detected. The 3D view is a relative anomaly index, not depth, grade or a resource estimate."
     >
       <DashboardSwitcher current="dash-exploration" onSwitch={onSwitch} />
     </DashboardHeader>
     {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
     {loading && <p className="text-sm text-slate-500">Loading dashboard…</p>}


     {data && <>
       <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
         <Panel title="Exploration map" actions={
           <div className="flex gap-3 text-xs">
             <button type="button" onClick={() => setPickMode((v) => !v)} className={pickMode ? 'text-amber-300' : 'text-emerald-400'}>
               {pickMode ? 'Click the map to place zone…' : 'Pick 500 sq mile zone'}
             </button>
             {zone && <button type="button" onClick={() => setZone(null)} className="text-slate-400">Clear zone</button>}
             <button type="button" onClick={refresh} className="text-emerald-400">Refresh</button>
           </div>
         }>
           <div className="overflow-hidden rounded border border-slate-800">
             <MapContainer center={[-15, 28]} zoom={4} scrollWheelZoom className={`h-[520px] w-full bg-slate-950 ${pickMode ? 'cursor-crosshair' : ''}`}>
               <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
               <ZoneController zone={zone} pickMode={pickMode} onPick={setZoneAt} />
               {show.gravity && gravity.map((layer) => <GridOverlay key={layer.id} layer={layer} />)}
               {show.magnetic && magnetic.map((layer) => <GridOverlay key={layer.id} layer={layer} />)}
               {zone && <Rectangle bounds={[[zone[1], zone[0]], [zone[3], zone[2]]]} pathOptions={{ color: '#38bdf8', weight: 2, fillOpacity: 0.04 }} />}
               {show.faults && data.fault_lines.map((fault) => (
                 <Polyline key={fault.id} positions={fault.points}
                   pathOptions={{ color: FAULT_COLOR[fault.confidence], weight: selectedFault === fault.id ? 7 : 4, dashArray: fault.confidence === 'Low' ? '6 6' : undefined }}
                   eventHandlers={{ click: () => setSelectedFault(fault.id) }}>
                   <Popup><strong>{fault.fault_name}</strong><br />{fault.fault_type} · {fault.length_km} km · strike {fault.strike_deg}°</Popup>
                 </Polyline>
               ))}
               {show.targets && data.discoveries.map((d) => (
                 <CircleMarker key={d.id} center={[d.latitude, d.longitude]} radius={6} pathOptions={{ color: '#34d399', fillColor: '#34d399', fillOpacity: 0.8 }}>
                   <Popup>
                     <strong>{d.mineral_target}</strong> · {d.country}<br />
                     Spectral confidence {d.spectral_confidence}<br />
                     <button type="button" onClick={() => setZoneAt(d.latitude, d.longitude)} className="mt-1 text-emerald-700 underline">Zoom to 500 sq mile zone</button>
                   </Popup>
                 </CircleMarker>
               ))}
             </MapContainer>
           </div>
           {zoneError && <p role="alert" className="mt-2 text-sm text-rose-400">{zoneError}</p>}
           {zone && <p className="mt-2 text-xs text-slate-400">Zone ≈ 500 sq miles: {zoneTargets.length} saved target(s), {zoneFaults.length} fault line(s) inside.</p>}
         </Panel>


         <div className="space-y-6">
           <Panel title="Layers">
             <div className="space-y-2">
               <Toggle checked={show.targets} onChange={(v) => setShow({ ...show, targets: v })} label={`Spectral targets (${data.discoveries.length})`} />
               <Toggle checked={show.faults} onChange={(v) => setShow({ ...show, faults: v })} label={`Fault lines (${data.fault_lines.length})`} />
               <Toggle checked={show.gravity && gravity.length > 0} disabled={!gravity.length} onChange={(v) => setShow({ ...show, gravity: v })}
                 label={`Gravity grids (${gravity.length})`} hint={gravity.length ? undefined : 'No gravity data uploaded'} />
               <Toggle checked={show.magnetic && magnetic.length > 0} disabled={!magnetic.length} onChange={(v) => setShow({ ...show, magnetic: v })}
                 label={`Magnetic grids (${magnetic.length})`} hint={magnetic.length ? undefined : 'No magnetic data uploaded'} />
             </div>
             {(!gravity.length || !magnetic.length) && <p className="mt-3 text-xs text-slate-500">Disabled toggles mean no survey grid is uploaded yet. Gravity/aeromagnetic feeds are not connected.</p>}
           </Panel>
           <Panel title="Data fusion inputs">
             <ul className="space-y-2 text-xs">
               {data.fusion_sources.map((source) => (
                 <li key={source.id} className="flex items-start gap-2">
                   <span className={source.connected ? 'text-emerald-400' : 'text-slate-600'}>●</span>
                   <span><span className="text-slate-200">{source.label}</span><br /><span className="text-slate-500">{source.status}</span></span>
                 </li>
               ))}
             </ul>
           </Panel>
         </div>
       </div>


       <div className="grid gap-6 lg:grid-cols-2">
         <Panel title="3D subsurface anomaly grid (data fusion)">
           {data.geophysics_layers.length === 0 ? (
             <p className="text-sm text-slate-500">Upload at least one gravity or magnetic grid to fuse and project a 3D surface.</p>
           ) : (
             <div className="space-y-3">
               <p className="text-xs text-slate-500">Select up to 4 layers. The first selected layer defines the grid; others are reprojected onto it by the data fusion engine.</p>
               <div className="space-y-1">
                 {data.geophysics_layers.map((layer) => (
                   <label key={layer.id} className="flex items-center gap-2 text-sm">
                     <input type="checkbox" className="accent-emerald-500" checked={meshLayers.includes(layer.id)}
                       onChange={(e) => setMeshLayers((current) => e.target.checked ? [...current, layer.id].slice(0, 4) : current.filter((id) => id !== layer.id))} />
                     {layer.layer_name} <span className="text-xs text-slate-500">({layer.layer_type}, {layer.units})</span>
                   </label>
                 ))}
               </div>
               <button type="button" disabled={!meshLayers.length || meshBusy} onClick={projectMesh} className="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:bg-slate-700">
                 {meshBusy ? 'Fusing…' : 'Project 3D surface'}
               </button>
               {meshError && <p role="alert" className="text-sm text-rose-400">{meshError}</p>}
               {mesh && <>
                 <div className="overflow-hidden rounded border border-slate-800"><MeshCanvas mesh={mesh} /></div>
                 <p className="text-xs text-slate-500">{mesh.valid_vertex_count.toLocaleString()} vertices · {mesh.fusion_layers.join(' + ')} · relative anomaly index (not depth)</p>
               </>}
             </div>
           )}
         </Panel>


         <Panel title="Fault line analysis">
           {data.fault_lines.length === 0 ? <p className="text-sm text-slate-500">No fault lines recorded. Add interpreted traces below.</p> : (
             <div className="overflow-x-auto">
               <table className="w-full text-sm">
                 <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2 text-left">Fault</th><th className="text-left">Type</th><th className="text-right">Length km</th><th className="text-right">Strike °</th><th className="text-left pl-3">Conf.</th></tr></thead>
                 <tbody>
                   {data.fault_lines.map((fault) => (
                     <tr key={fault.id} onClick={() => setSelectedFault(fault.id)} className={`cursor-pointer border-t border-slate-800 ${selectedFault === fault.id ? 'bg-slate-900' : ''}`}>
                       <td className="py-2">{fault.fault_name}</td><td>{fault.fault_type}</td>
                       <td className="text-right">{fault.length_km}</td><td className="text-right">{fault.strike_deg}</td><td className="pl-3">{fault.confidence}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               <p className="mt-2 text-xs text-slate-500">Length and strike are computed from the vertices you supplied; faults are not detected automatically.</p>
             </div>
           )}
         </Panel>
       </div>


       <div className="grid gap-6 lg:grid-cols-3">
         <Panel title="Order a structural report"><OrderReport zone={zone} fee={data.structural_report_fee_gbp} onOrdered={refresh} /></Panel>
         <QuickForm
           title="Add fault line"
           collection="fault-lines"
           onSaved={refresh}
           hint="Vertices as latitude, longitude pairs separated by semicolons."
           fields={[
             { name: 'fault_name', label: 'Fault name' },
             { name: 'fault_type', label: 'Type', options: ['Unclassified', 'Normal', 'Reverse', 'Strike-slip', 'Thrust'], defaultValue: 'Unclassified' },
             { name: 'confidence', label: 'Confidence', options: ['Low', 'Moderate', 'High'], defaultValue: 'Moderate' },
             { name: 'source', label: 'Source / interpretation' },
             { name: 'points', label: 'Vertices', placeholder: '-19.1, 29.0; -19.0, 29.1', wide: true }
           ]}
           transform={(v) => ({ ...v, points: parsePoints(v.points, 2) })}
         />
         <Panel title="Gravity / magnetic data"><GridUpload onSaved={refresh} /></Panel>
       </div>
     </>}
   </div>
 );
}
