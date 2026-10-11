import React, { useCallback, useEffect, useState } from 'react';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { RecordWorkspace } from './PortalWorkspaces';

function useCollection(collection) {
  const { logout } = useAuth();
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api(`/api/v1/portal/${collection}`);
      setRecords(data);
      setError('');
    } catch (err) {
      if (err.status === 401) logout();
      else setError(err.message || 'Unable to load records.');
    } finally {
      setLoading(false);
    }
  }, [collection, logout]);

  useEffect(() => { refresh(); }, [refresh]);
  return { records, error, loading, refresh };
}

function LinearAssetMap({ assets }) {
  const visible = assets.filter((asset) => Number.isFinite(asset.start_latitude) && Number.isFinite(asset.start_longitude));
  return (
    <div className="overflow-hidden rounded-lg border border-slate-800">
      <MapContainer center={[-4, 24]} zoom={3} scrollWheelZoom className="h-[420px] w-full bg-slate-950">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {visible.map((asset) => {
          const start = [asset.start_latitude, asset.start_longitude];
          const hasEnd = Number.isFinite(asset.end_latitude) && Number.isFinite(asset.end_longitude);
          const path = hasEnd ? [start, [asset.end_latitude, asset.end_longitude]] : [start];
          const color = asset.criticality === 'Critical' ? '#fb7185' : asset.criticality === 'High' ? '#f59e0b' : '#34d399';
          return (
            <React.Fragment key={asset.id}>
              {hasEnd && <Polyline positions={path} pathOptions={{ color, weight: 4 }} />}
              <CircleMarker center={start} radius={7} pathOptions={{ color, fillColor: color, fillOpacity: 0.85 }}>
                <Popup>
                  <strong>{asset.asset_name}</strong><br />
                  {asset.asset_type} · {asset.country}<br />
                  {asset.criticality} criticality
                </Popup>
              </CircleMarker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}

export function LinearAssetRiskDashboard() {
  const { records, error, loading, refresh } = useCollection('linear-assets');
  return (
    <div className="space-y-6 max-w-6xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Infrastructure Asset Registry & Risk</h1>
        <p className="text-sm text-slate-400">Map registered pipelines, power lines, tailings facilities and slope assets against recorded ground-motion observations.</p>
        <p className="text-xs text-amber-400">Map markers use entered asset coordinates. No satellite-derived displacement layer is currently connected.</p>
      </header>
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
      <LinearAssetMap assets={records} />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{loading ? 'Loading assets…' : `${records.length} registered assets`}</span>
        <button onClick={refresh} className="text-emerald-400 hover:text-emerald-300">Refresh map</button>
      </div>
      <RecordWorkspace
        title="Asset Registry"
        subtitle="Register the location and alignment of infrastructure to monitor."
        note="Coordinates and routes are client-entered reference geometry, not utility operator GIS data."
        collection="linear-assets"
        fields={[
          { name: 'asset_reference', label: 'Asset reference' },
          { name: 'asset_name', label: 'Asset name' },
          { name: 'asset_type', label: 'Asset type', options: ['Pipeline', 'High-voltage line', 'Tailings dam', 'Slope', 'Rail', 'Other'], defaultValue: 'Pipeline' },
          { name: 'operator', label: 'Operator' },
          { name: 'country', label: 'Country' },
          { name: 'start_latitude', label: 'Start latitude', type: 'number', min: -90, max: 90, step: 'any' },
          { name: 'start_longitude', label: 'Start longitude', type: 'number', min: -180, max: 180, step: 'any' },
          { name: 'end_latitude', label: 'End latitude (optional)', type: 'number', min: -90, max: 90, step: 'any', required: false },
          { name: 'end_longitude', label: 'End longitude (optional)', type: 'number', min: -180, max: 180, step: 'any', required: false },
          { name: 'criticality', label: 'Criticality', options: ['Low', 'Moderate', 'High', 'Critical'], defaultValue: 'Moderate' }
        ]}
        columns={[
          { key: 'asset_reference', label: 'Reference' }, { key: 'asset_name', label: 'Asset' },
          { key: 'asset_type', label: 'Type' }, { key: 'country', label: 'Country' }, { key: 'criticality', label: 'Criticality' }
        ]}
      />
    </div>
  );
}

function DisplacementChart({ records }) {
  const points = [...records].sort((a, b) => a.acquisition_date.localeCompare(b.acquisition_date));
  if (!points.length) return <div className="flex h-48 items-center justify-center text-sm text-slate-500">Add observations to chart displacement history.</div>;
  const width = 720;
  const height = 210;
  const margin = 28;
  const peak = Math.max(2.5, ...points.map((p) => Math.abs(p.displacement_mm)));
  const getX = (index) => margin + (points.length === 1 ? (width - margin * 2) / 2 : index * (width - margin * 2) / (points.length - 1));
  const getY = (value) => margin + ((peak - value) / (peak * 2)) * (height - margin * 2);
  const path = points.map((p, i) => `${i ? 'L' : 'M'} ${getX(i)} ${getY(p.displacement_mm)}`).join(' ');
  const thresholdY = getY(2.5);
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[640px] w-full" role="img" aria-label="Recorded displacement trend in millimetres">
        <line x1={margin} y1={thresholdY} x2={width - margin} y2={thresholdY} stroke="#f59e0b" strokeDasharray="5 5" />
        <line x1={margin} y1={getY(-2.5)} x2={width - margin} y2={getY(-2.5)} stroke="#f59e0b" strokeDasharray="5 5" />
        <line x1={margin} y1={height / 2} x2={width - margin} y2={height / 2} stroke="#475569" />
        <path d={path} fill="none" stroke="#34d399" strokeWidth="3" />
        {points.map((point, index) => <circle key={point.id} cx={getX(index)} cy={getY(point.displacement_mm)} r="4" fill={Math.abs(point.displacement_mm) >= 2.5 ? '#fb7185' : '#34d399'} />)}
        <text x={margin} y={height - 5} fill="#94a3b8" fontSize="11">{points[0].acquisition_date}</text>
        <text x={width - margin} y={height - 5} textAnchor="end" fill="#94a3b8" fontSize="11">{points.at(-1).acquisition_date}</text>
        <text x={width - margin} y={thresholdY - 5} textAnchor="end" fill="#fbbf24" fontSize="10">+2.5 mm review line</text>
      </svg>
      <p className="px-3 text-xs text-slate-500">Submitted observations only · thresholds indicate review prompts, not a validated failure prediction.</p>
    </div>
  );
}

export function InSARTelemetry() {
  const { records } = useCollection('insar-observations');
  return (
    <div className="space-y-6 max-w-6xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Ground Movement Telemetry</h1>
        <p className="text-sm text-slate-400">Review time-series displacement and scene coherence for registered assets.</p>
        <p className="text-xs text-amber-400">Measurements are imported or manually entered; this prototype does not process Sentinel-1 interferograms or guarantee millimetre accuracy.</p>
      </header>
      <DisplacementChart records={records} />
      <RecordWorkspace
        title="Record an InSAR Observation"
        subtitle="Attach a displacement measurement to an asset and its acquisition scene."
        collection="insar-observations"
        fields={[
          { name: 'asset_reference', label: 'Asset reference' },
          { name: 'acquisition_date', label: 'Acquisition date', type: 'date' },
          { name: 'displacement_mm', label: 'Displacement (mm)', type: 'number', step: '0.01' },
          { name: 'velocity_mm_per_year', label: 'Velocity (mm/year)', type: 'number', step: '0.01' },
          { name: 'coherence', label: 'Coherence (0–1)', type: 'number', min: 0, max: 1, step: '0.01' },
          { name: 'scene_reference', label: 'Scene / source reference' },
          { name: 'source', label: 'Observation source', options: ['Manual QA', 'Imported Sentinel-1', 'Synthetic demo'], defaultValue: 'Manual QA' }
        ]}
        columns={[
          { key: 'asset_reference', label: 'Asset' }, { key: 'acquisition_date', label: 'Date' },
          { key: 'displacement_mm', label: 'Displacement mm' }, { key: 'velocity_mm_per_year', label: 'Velocity mm/year' },
          { key: 'coherence', label: 'Coherence' }, { key: 'scene_reference', label: 'Scene' }, { key: 'source', label: 'Source' }
        ]}
      />
    </div>
  );
}

function AlertFeed() {
  const { records, error, loading, refresh } = useCollection('insar-alerts');
  useEffect(() => {
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, [refresh]);
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">Movement alerts</h2>
        <button onClick={refresh} className="text-xs text-emerald-400">Refresh</button>
      </div>
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
      {loading ? <p className="text-sm text-slate-500">Loading alerts…</p> : records.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-center text-sm text-slate-500">No threshold alerts recorded.</div>
      ) : records.map((record) => (
        <article key={record.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
          <div>
            <p className="font-medium text-slate-200">{record.asset_name} · {record.severity}</p>
            <p className="mt-1 text-sm text-slate-400">{record.message}</p>
            <p className="mt-1 text-xs text-slate-600">Observation {record.observation_id} · {record.created_at}</p>
          </div>
          <span className={`rounded px-2 py-1 text-xs ${record.severity === 'Critical' ? 'bg-rose-500/10 text-rose-300' : 'bg-amber-500/10 text-amber-300'}`}>{record.status}</span>
        </article>
      ))}
    </section>
  );
}

export function PipelineEmergencyAlerts() {
  return (
    <div className="space-y-6 max-w-6xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Asset Thresholds & Advisory Alerts</h1>
        <p className="text-sm text-slate-400">Set displacement thresholds and route resulting warnings for human review.</p>
        <p className="text-xs text-amber-400">Alerts are advisory records only. No valve, breaker, grid reroute or emergency service is automatically actuated.</p>
      </header>
      <RecordWorkspace
        title="Threshold Rules"
        subtitle="Configure a displacement threshold per asset or use * for a workspace-wide default."
        collection="insar-thresholds"
        fields={[
          { name: 'asset_reference', label: 'Asset reference (* for all assets)', defaultValue: '*' },
          { name: 'threshold_mm', label: 'Displacement threshold (mm)', type: 'number', min: '0.01', max: 100, step: '0.01', defaultValue: '2.5' },
          { name: 'enabled', label: 'Enabled', options: ['true', 'false'], defaultValue: 'true' },
          { name: 'notify_contact', label: 'Review contact email', type: 'email', required: false }
        ]}
        transform={(values) => ({ ...values, enabled: values.enabled === 'true', threshold_mm: Number(values.threshold_mm) })}
        columns={[
          { key: 'asset_reference', label: 'Asset' }, { key: 'threshold_mm', label: 'Threshold mm' },
          { key: 'enabled', label: 'Enabled' }, { key: 'notify_contact', label: 'Review contact' }
        ]}
      />
      <AlertFeed />
    </div>
  );
}

export function DataFusionReadiness() {
  const [sources, setSources] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { api('/api/v1/gaas/fusion-sources').then(setSources).catch((err) => setError(err.message)); }, []);
  return (
    <div className="space-y-6 max-w-5xl">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Multi-Dimensional Data Fusion</h1>
        <p className="text-sm text-slate-400">Layer readiness for optical, geophysical and historical evidence used in exploration screening.</p>
        <p className="text-xs text-amber-400">A fused tensor requires georeferenced layers with compatible coverage. A spectral anomaly is not a mineral assay or resource estimate.</p>
      </header>
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {sources.map((source) => (
          <article key={source.id} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-semibold text-slate-200">{source.label}</h2>
              <span className={`text-xs ${source.connected ? 'text-emerald-400' : 'text-amber-400'}`}>{source.connected ? 'Connected' : 'Not connected'}</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{source.description}</p>
            <p className="mt-2 text-xs text-slate-600">{source.status}</p>
          </article>
        ))}
      </div>
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
        <h2 className="font-semibold text-slate-200">3D surface preview</h2>
        <p className="mt-1 text-sm text-slate-400">The backend mesh generator can turn an aligned raster anomaly surface into vertices and faces. Gravity, magnetic and elevation layers must be supplied before a site-specific mesh can be generated.</p>
      </div>
    </div>
  );
}
