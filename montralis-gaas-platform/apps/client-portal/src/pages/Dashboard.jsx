import React, { useEffect, useState } from 'react';
import MapViewer from '../components/MapViewer';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';


export default function Dashboard({ target, setTarget, layers, focus, countries, minerals, catalogError, onRetryCatalog }) {
 const { logout } = useAuth();
 const [country, setCountry] = useState('Zimbabwe');
 const [mineral, setMineral] = useState('Lithium');
 const [area, setArea] = useState('');
 const [source, setSource] = useState('sentinel2-aws');
 const [sources, setSources] = useState([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const selected = countries.find((c) => c.name === country);
 const selectedMineral = minerals.find((m) => m.name === mineral);
 const mineralClasses = [...new Set(minerals.map((m) => m.classification))];
 const catalogReady = countries.length > 0 && minerals.length > 0;


 useEffect(() => {
   api('/api/v1/gaas/data-sources').then(setSources).catch(() => {});
 }, []);


 const runScan = async () => {
   setLoading(true);
   setError('');
   try {
     const data = await api('/api/v1/gaas/universal-scan', {
       method: 'POST',
       body: JSON.stringify({ country, target_mineral: mineral, data_source: source, area: area || null })
     });
     setTarget(data.discovery_payload);
   } catch (err) {
     if (err.status === 401) return logout();
     setError(err.status ? err.message : 'Unable to reach the Spectral Engine.');
   } finally {
     setLoading(false);
   }
 };


 const selectClass =
   'w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 focus:border-emerald-500 outline-none';


 return (
   <div className="space-y-6 max-w-5xl">
     <div>
       <h2 className="text-2xl font-bold">Universal Mineral Index Spectrometer</h2>
       <p className="text-sm text-slate-400">
         Trigger multi-spectral planetary ratios to discover deep tier assets asset-lightly.
       </p>
     </div>


     <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
       <div>
         <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Country Registry</label>
         <select
           value={country}
           onChange={(e) => {
             setCountry(e.target.value);
             setArea('');
           }}
           className={selectClass}
         >
           {countries.length ? countries.map((c) => <option key={c.name} value={c.name}>{c.name}</option>) : <option value="Zimbabwe">Zimbabwe (registry loading)</option>}
         </select>
       </div>
       <div>
         <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Mining Area</label>
         <select value={area} onChange={(e) => setArea(e.target.value)} className={selectClass}>
           <option value="">Automatic (mapped match or national reference)</option>
           {(selected?.areas || []).filter((a) => !a.reference_only && a.minerals.includes(mineral.toUpperCase())).map((a) => <option key={a.source_id || a.name} value={a.name}>{a.name}</option>)}
         </select>
       </div>
       <div>
         <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Target Element</label>
         <select value={mineral} onChange={(e) => { setMineral(e.target.value); setArea(''); }} className={selectClass}>
           {minerals.length === 0 && <option value="Lithium">Lithium (registry loading)</option>}
           {mineralClasses.map((group) => (
             <optgroup key={group} label={group}>
               {minerals.filter((m) => m.classification === group).map((m) => (
                 <option key={m.symbol} value={m.name}>{m.name} ({m.symbol})</option>
               ))}
             </optgroup>
           ))}
         </select>
       </div>
       <div>
         <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Data Source</label>
         <select value={source} onChange={(e) => setSource(e.target.value)} className={selectClass}>
           {sources.map((s) => (
             <option key={s.id} value={s.id} disabled={!s.available} title={s.note}>
               {s.label}{s.available ? '' : ' (unavailable)'}
             </option>
           ))}
         </select>
       </div>
       <div className="flex items-end">
         <button
           onClick={runScan}
           disabled={loading || !catalogReady}
           className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold py-2 px-4 rounded transition"
         >
           {loading ? 'Processing Raster Matrices...' : 'Execute Planetary Scan'}
         </button>
       </div>
     </div>
     {selectedMineral && (
       <div className="text-xs text-slate-400 space-y-1">
         <p>
           {selectedMineral.classification} | {selectedMineral.primary_sensor_bands} | {selectedMineral.wavelength_profile}
         </p>
         <p>{selectedMineral.signature_behavior}</p>
         {source !== 'simulated' && selectedMineral.sentinel2_note && (
           <p className={selectedMineral.sentinel2_mode === 'unsupported' ? 'text-amber-400' : 'text-sky-300'}>
             {selectedMineral.sentinel2_mode === 'unsupported' ? 'Sensor limitation: ' : 'Screening limitation: '}
             {selectedMineral.sentinel2_note}
           </p>
         )}
       </div>
     )}
     {catalogError && (
       <div role="alert" className="flex items-center justify-between gap-3 text-sm text-rose-400">
         <span>Country and target-element registries could not load: {catalogError}</span>
         <button onClick={onRetryCatalog} className="shrink-0 underline">Retry</button>
       </div>
     )}
     {!catalogReady && !catalogError && <p className="text-xs text-slate-500">Loading country and target-element registries…</p>}
     {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
     {target?.mining_area && (
       <p className="text-xs text-slate-400">
         Target area: <span className="text-emerald-400">{target.mining_area}</span>, {target.country}
         {target.georeference === 'national_reference' && ' (no mapped mining area for this mineral; national reference point used)'}
       </p>
     )}
     {target?.scene_id && (
       <p className="text-xs font-mono text-slate-500">
         Scene {target.scene_id} | {target.scene_datetime?.slice(0, 10)} | cloud {Number(target.cloud_cover).toFixed(1)}% | {target.data_source}
       </p>
     )}


     <MapViewer activeTarget={target} layers={layers} focus={focus} />
   </div>
 );
}

