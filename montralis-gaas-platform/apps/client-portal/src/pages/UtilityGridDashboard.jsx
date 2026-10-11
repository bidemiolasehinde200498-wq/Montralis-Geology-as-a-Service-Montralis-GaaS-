import React, { useEffect, useState } from 'react';
import { CircleMarker, MapContainer, Polygon, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { DashboardHeader, DashboardSwitcher, Gauge, Panel, QuickForm, parsePoints, statusColor, useDashboardData } from './dashboardKit';

const UTILITY_TYPES = ['Pipeline', 'High-voltage line', 'Rail', 'Other'];
const HAZARD_BADGE = {
  'Very high': 'bg-rose-500/20 text-rose-300', High: 'bg-orange-500/20 text-orange-300',
  Moderate: 'bg-amber-500/20 text-amber-300', Low: 'bg-emerald-500/20 text-emerald-300'
};

function vectorPath(asset) {
  const start = [asset.start_latitude, asset.start_longitude];
  const hasEnd = Number.isFinite(asset.end_latitude) && Number.isFinite(asset.end_longitude);
  return hasEnd ? [start, [asset.end_latitude, asset.end_longitude]] : [start];
}

function FitToSelection({ path }) {
  const map = useMap();
  useEffect(() => {
    if (!path || !path.length) return;
    if (path.length === 1) map.setView(path[0], Math.max(map.getZoom(), 9));
    else map.fitBounds(path, { padding: [60, 60], maxZoom: 11 });
  }, [path, map]);
  return null;
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-200">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-emerald-500" />
      {label}
    </label>
  );
}

function MotionBar({ index, status }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded bg-slate-800" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={index ?? 0} aria-label="Ground-motion index">
      <div className="h-full" style={{ width: `${index ?? 0}%`, background: statusColor(status) }} />
    </div>
  );
}

export default function UtilityGridDashboard({ onSwitch }) {
  const { data, error, loading, refresh } = useDashboardData('/api/v1/dashboards/utility-grid', 30000);
  const [selectedId, setSelectedId] = useState(null);
  const [show, setShow] = useState({ landslide: true, permafrost: true });
  const [focusPath, setFocusPath] = useState(null);

  const select = (vector) => {
    setSelectedId(vector.asset.id);
    setFocusPath(vectorPath(vector.asset));
  };

  const selected = data?.vectors.find((vector) => vector.asset.id === selectedId) || null;
  const refOptions = data?.vectors.map((vector) => vector.asset.asset_reference) || [];
  const landslides = data?.hazard_zones.filter((zone) => zone.hazard_type === 'Landslide hazard zone') || [];
  const thawLines = data?.hazard_zones.filter((zone) => zone.hazard_type === 'Permafrost thaw line') || [];

  return (
    <div className="max-w-7xl space-y-6">
      <DashboardHeader
        title="Energy Infrastructure & Geohazard Monitoring"
        audience="Grid Operations Directors and Pipeline Engineers"
        note="Hazard zones and thaw lines are geometry you supply; no national landslide or permafrost dataset is connected. Risk meters reflect the latest recorded InSAR observation (refreshed every 30 s from stored records, not live sensors). Advisory only: no valve, breaker or grid action is triggered."
      >
        <DashboardSwitcher current="dash-utility" onSwitch={onSwitch} />
      </DashboardHeader>
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading dashboard…</p>}

      {data && <>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Panel title="Asset vectors and hazard overlays" actions={<button type="button" onClick={refresh} className="text-xs text-emerald-400">Refresh</button>}>
            <div className="mb-3 flex flex-wrap gap-5">
              <Toggle checked={show.landslide} onChange={(v) => setShow({ ...show, landslide: v })} label={`Landslide hazard zones (${landslides.length})`} />
              <Toggle checked={show.permafrost} onChange={(v) => setShow({ ...show, permafrost: v })} label={`Permafrost thaw lines (${thawLines.length})`} />
            </div>
            <div className="overflow-hidden rounded border border-slate-800">
              <MapContainer center={[-4, 24]} zoom={3} scrollWheelZoom className="h-[520px] w-full bg-slate-950">
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <FitToSelection path={focusPath} />
                {show.landslide && landslides.map((zone) => (
                  <Polygon key={zone.id} positions={zone.points} pathOptions={{ color: '#fb923c', weight: 1.5, fillOpacity: 0.25 }}>
                    <Popup><strong>{zone.zone_name}</strong><br />{zone.hazard_type} · {zone.susceptibility}<br />Source: {zone.source}</Popup>
                  </Polygon>
                ))}
                {show.permafrost && thawLines.map((zone) => (
                  <Polyline key={zone.id} positions={zone.points} pathOptions={{ color: '#22d3ee', weight: 3, dashArray: '8 6' }}>
                    <Popup><strong>{zone.zone_name}</strong><br />{zone.hazard_type} · {zone.susceptibility} · {zone.buffer_km} km buffer<br />Source: {zone.source}</Popup>
                  </Polyline>
                ))}
                {data.vectors.map((vector) => {
                  const path = vectorPath(vector.asset);
                  const color = statusColor(vector.motion_status);
                  const isSelected = vector.asset.id === selectedId;
                  const handlers = { click: () => select(vector) };
                  return path.length === 2 ? (
                    <Polyline key={vector.asset.id} positions={path} pathOptions={{ color, weight: isSelected ? 8 : 5 }} eventHandlers={handlers}>
                      <Popup><strong>{vector.asset.asset_name}</strong><br />{vector.asset.asset_type} · {vector.motion_status}</Popup>
                    </Polyline>
                  ) : (
                    <CircleMarker key={vector.asset.id} center={path[0]} radius={isSelected ? 10 : 7} pathOptions={{ color, fillColor: color, fillOpacity: 0.85 }} eventHandlers={handlers}>
                      <Popup><strong>{vector.asset.asset_name}</strong><br />{vector.motion_status}</Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </div>
            <p className="mt-2 text-xs text-slate-500">Click a pipeline or line to select it. Overlap uses 25 sample points along the straight start–end vector you registered, not a surveyed route.</p>
          </Panel>

          <div className="space-y-6">
            <Panel title={selected ? selected.asset.asset_name : 'Selected asset'}>
              {!selected ? <p className="text-sm text-slate-500">Select an asset on the map or in the list.</p> : (
                <div className="space-y-4">
                  <Gauge fraction={(selected.motion_index ?? 0) / 100} status={selected.motion_status}
                    valueText={selected.motion_index == null ? 'No data' : `${selected.motion_index}`}
                    caption="Ground-motion index (100 = Critical level)" />
                  <dl className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <dt>Type</dt><dd className="text-right text-slate-200">{selected.asset.asset_type}</dd>
                    <dt>Latest displacement</dt><dd className="text-right text-slate-200">{selected.latest ? `${selected.latest.displacement_mm} mm` : '—'}</dd>
                    <dt>Observed</dt><dd className="text-right text-slate-200">{selected.latest?.acquisition_date || '—'}</dd>
                    <dt>Warning limit</dt><dd className="text-right text-slate-200">{selected.threshold_mm} mm ({selected.threshold_source})</dd>
                    <dt>Hazard class</dt><dd className="text-right text-slate-200">{selected.hazard_class}</dd>
                  </dl>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Overlaps</p>
                    {selected.hazard_overlaps.length === 0 ? <p className="text-xs text-slate-500">No recorded hazard zone or thaw line intersects this asset.</p> : (
                      <ul className="space-y-1">
                        {selected.hazard_overlaps.map((overlap) => (
                          <li key={overlap.zone_id} className="flex items-center justify-between gap-2 text-xs">
                            <span>{overlap.zone_name} <span className="text-slate-500">· {overlap.hazard_type}</span></span>
                            <span className={`rounded px-2 py-0.5 ${HAZARD_BADGE[overlap.susceptibility]}`}>{overlap.susceptibility}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </Panel>
          </div>
        </div>

        <Panel title={`Landslide / ground-motion risk meters (${data.vectors.length} assets)`}>
          {data.vectors.length === 0 ? <p className="text-sm text-slate-500">No pipelines or lines registered. Register one below.</p> : (
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {data.vectors.map((vector) => (
                <li key={vector.asset.id}>
                  <button type="button" onClick={() => select(vector)} aria-pressed={vector.asset.id === selectedId}
                    className={`w-full space-y-2 rounded border p-3 text-left ${vector.asset.id === selectedId ? 'border-emerald-500 bg-slate-900' : 'border-slate-800 hover:bg-slate-900'}`}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{vector.asset.asset_name}</span>
                      <span className="text-xs" style={{ color: statusColor(vector.motion_status) }}>{vector.motion_status}</span>
                    </div>
                    <MotionBar index={vector.motion_index} status={vector.motion_status} />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{vector.motion_index == null ? 'No observations' : `Index ${vector.motion_index}`}</span>
                      <span>Hazard: {vector.hazard_class}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <ul className="mt-4 space-y-1 text-xs text-slate-500">{data.notes.map((note) => <li key={note}>• {note}</li>)}</ul>
        </Panel>

        <div className="grid gap-6 lg:grid-cols-3">
          <QuickForm
            title="Register pipeline / line"
            collection="linear-assets"
            onSaved={refresh}
            fields={[
              { name: 'asset_reference', label: 'Reference' }, { name: 'asset_name', label: 'Name' },
              { name: 'asset_type', label: 'Type', options: UTILITY_TYPES, defaultValue: 'Pipeline' },
              { name: 'operator', label: 'Operator' }, { name: 'country', label: 'Country' },
              { name: 'criticality', label: 'Criticality', options: ['Low', 'Moderate', 'High', 'Critical'], defaultValue: 'Moderate' },
              { name: 'start_latitude', label: 'Start latitude', type: 'number', step: 'any', min: -90, max: 90 },
              { name: 'start_longitude', label: 'Start longitude', type: 'number', step: 'any', min: -180, max: 180 },
              { name: 'end_latitude', label: 'End latitude', type: 'number', step: 'any', min: -90, max: 90 },
              { name: 'end_longitude', label: 'End longitude', type: 'number', step: 'any', min: -180, max: 180 }
            ]}
            transform={(v) => Object.fromEntries(Object.entries(v).map(([key, value]) => [key, /latitude|longitude/.test(key) ? Number(value) : value]))}
          />
          <QuickForm
            title="Add hazard zone / thaw line"
            collection="hazard-zones"
            onSaved={refresh}
            hint="Landslide zones need 3+ vertices (polygon). Thaw lines need 2+ vertices; assets within the buffer distance count as overlapping."
            fields={[
              { name: 'zone_name', label: 'Name' },
              { name: 'hazard_type', label: 'Type', options: ['Landslide hazard zone', 'Permafrost thaw line'], defaultValue: 'Landslide hazard zone' },
              { name: 'susceptibility', label: 'Susceptibility', options: ['Low', 'Moderate', 'High', 'Very high'], defaultValue: 'Moderate' },
              { name: 'buffer_km', label: 'Thaw-line buffer (km)', type: 'number', min: '0.1', max: 50, step: '0.1', defaultValue: '2' },
              { name: 'source', label: 'Source / provenance', wide: true },
              { name: 'points', label: 'Vertices', placeholder: '-19.05, 29.05; -19.05, 29.15; -18.95, 29.1', wide: true }
            ]}
            transform={(v) => ({ ...v, buffer_km: Number(v.buffer_km), points: parsePoints(v.points, v.hazard_type === 'Landslide hazard zone' ? 3 : 2) })}
          />
          <QuickForm
            key={`obs-${selectedId}`}
            title="Record InSAR observation"
            collection="insar-observations"
            onSaved={refresh}
            fields={[
              { name: 'asset_reference', label: 'Asset reference', options: refOptions.length ? refOptions : ['(register an asset first)'], defaultValue: selected?.asset.asset_reference || refOptions[0] || '' },
              { name: 'acquisition_date', label: 'Acquisition date', type: 'date' },
              { name: 'displacement_mm', label: 'Displacement (mm)', type: 'number', step: '0.01' },
              { name: 'velocity_mm_per_year', label: 'Velocity (mm/yr)', type: 'number', step: '0.01' },
              { name: 'coherence', label: 'Coherence (0-1)', type: 'number', min: 0, max: 1, step: '0.01' },
              { name: 'scene_reference', label: 'Scene / source reference' },
              { name: 'source', label: 'Source', options: ['Manual QA', 'Imported Sentinel-1', 'Synthetic demo'], defaultValue: 'Manual QA' }
            ]}
            transform={(v) => {
              if (!refOptions.includes(v.asset_reference)) throw new Error('Register an asset first.');
              return { ...v, displacement_mm: Number(v.displacement_mm), velocity_mm_per_year: Number(v.velocity_mm_per_year), coherence: Number(v.coherence) };
            }}
          />
        </div>
      </>}
    </div>
  );
}
