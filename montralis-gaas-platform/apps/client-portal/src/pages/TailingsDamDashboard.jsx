import React, { useEffect, useState } from 'react';
import { DashboardHeader, DashboardSwitcher, Gauge, LineChart, Panel, QuickForm, statusColor, useDashboardData } from './dashboardKit';

const LOG_STYLE = {
  Critical: 'border-rose-500 bg-rose-950/60 text-rose-100',
  Warning: 'border-amber-500/60 bg-amber-950/30 text-amber-100'
};

function AlertLog({ alerts }) {
  const active = alerts.filter((alert) => alert.status === 'Open');
  return (
    <Panel title={`Active wall-movement log (${active.length} open)`}>
      {alerts.length === 0 ? <p className="text-sm text-slate-500">No wall-movement alerts recorded.</p> : (
        <ul className="max-h-[420px] space-y-2 overflow-y-auto" aria-live="polite">
          {alerts.map((alert) => {
            const flashing = alert.status === 'Open' && alert.severity === 'Critical';
            return (
              <li key={alert.id} className={`rounded border-l-4 p-3 text-sm ${LOG_STYLE[alert.severity]} ${flashing ? 'animate-pulse motion-reduce:animate-none' : ''} ${alert.status !== 'Open' ? 'opacity-60' : ''}`}>
                <p className="font-semibold">{flashing && <span aria-hidden="true">● </span>}{alert.asset_name} · {alert.severity} · {alert.status}</p>
                <p>{alert.message}</p>
                <p className="mt-1 text-xs opacity-70">{new Date(alert.created_at).toLocaleString()}</p>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-slate-500">Advisory records for human review. Nothing is automatically actuated, evacuated or reported to a regulator.</p>
    </Panel>
  );
}

function DamCard({ dam, selected, onSelect }) {
  const color = statusColor(dam.status);
  const flashing = dam.status === 'Critical' && dam.open_alerts > 0;
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected}
      className={`w-full rounded-lg border p-3 text-left transition ${selected ? 'border-emerald-500 bg-slate-900' : 'border-slate-800 bg-slate-950 hover:bg-slate-900'} ${flashing ? 'animate-pulse motion-reduce:animate-none' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{dam.asset.asset_name}</span>
        <span className="rounded px-2 py-0.5 text-xs font-semibold" style={{ background: `${color}22`, color }}>{dam.status}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {dam.latest ? `Latest ${dam.latest.displacement_mm} mm on ${dam.latest.acquisition_date}` : 'No observations yet'} · limit {dam.threshold_mm} mm
      </p>
    </button>
  );
}

export default function TailingsDamDashboard({ onSwitch }) {
  const { data, error, loading, refresh } = useDashboardData('/api/v1/dashboards/tailings-dam', 30000);
  const [selectedRef, setSelectedRef] = useState('');

  useEffect(() => {
    if (!data?.dams.length) return;
    if (!data.dams.some((dam) => dam.asset.asset_reference === selectedRef)) setSelectedRef(data.dams[0].asset.asset_reference);
  }, [data, selectedRef]);

  const dam = data?.dams.find((item) => item.asset.asset_reference === selectedRef);
  const damOptions = data?.dams.map((item) => item.asset.asset_reference) || [];
  const flagFor = (value, limit) => (Math.abs(value) >= limit * 2 ? '#f43f5e' : Math.abs(value) >= limit ? '#f59e0b' : '#34d399');

  return (
    <div className="max-w-7xl space-y-6">
      <DashboardHeader
        title="Tailings Dam Movement & Environmental Risk"
        audience="Environmental Compliance Officers and Insurance Underwriters"
        note="Displacement values are entered or imported records; Sentinel-1 interferogram processing is not connected and millimetre accuracy is not guaranteed. Status is an advisory review prompt, not a stability or safety determination. Refreshes every 30 s from stored records."
      >
        <DashboardSwitcher current="dash-tailings" onSwitch={onSwitch} />
      </DashboardHeader>
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading dashboard…</p>}

      {data && <>
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-300">Monitored dams ({data.dams.length})</h2>
            {data.dams.length === 0 && <p className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-500">No tailings dams registered. Register one below.</p>}
            {data.dams.map((item) => (
              <DamCard key={item.asset.id} dam={item} selected={item.asset.asset_reference === selectedRef} onSelect={() => setSelectedRef(item.asset.asset_reference)} />
            ))}
          </div>

          {dam ? (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
                <Panel title="Safety threshold gauge" className="flex flex-col items-center">
                  <Gauge
                    fraction={dam.utilisation_pct == null ? 0 : dam.utilisation_pct / 200}
                    status={dam.status}
                    valueText={dam.latest ? `${Math.abs(dam.latest.displacement_mm).toFixed(2)} mm` : 'No data'}
                    caption={`Warning at ${dam.threshold_mm} mm · Critical at ${dam.threshold_mm * 2} mm`}
                  />
                  <p className="mt-2 text-xs text-slate-500">Limit source: {dam.threshold_source}</p>
                </Panel>
                <Panel title={`Deformation history — ${dam.asset.asset_name}`}>
                  <LineChart
                    unit="mm"
                    points={dam.series.map((p) => ({ x: p.date, y: p.displacement_mm, flag: flagFor(p.displacement_mm, dam.threshold_mm) }))}
                    refLines={[
                      { y: dam.threshold_mm, label: `+${dam.threshold_mm} mm warning` },
                      { y: -dam.threshold_mm, label: `-${dam.threshold_mm} mm warning` },
                      { y: dam.threshold_mm * 2, label: 'Critical', color: '#f43f5e' },
                      { y: -dam.threshold_mm * 2, label: 'Critical', color: '#f43f5e' }
                    ]}
                  />
                </Panel>
              </div>
              <Panel title="Deformation velocity (mm/year)">
                <LineChart unit="mm/yr" color="#38bdf8" points={dam.series.map((p) => ({ x: p.date, y: p.velocity_mm_per_year }))} />
                <p className="mt-2 text-xs text-slate-500">Velocity is the value recorded with each observation; the platform does not derive it from raw SAR scenes.</p>
              </Panel>
            </div>
          ) : (
            <Panel><p className="text-sm text-slate-500">Select or register a tailings dam to view deformation data.</p></Panel>
          )}
        </div>

        <AlertLog alerts={data.alerts} />

        <div className="grid gap-6 lg:grid-cols-3">
          <QuickForm
            title="Register tailings dam"
            collection="linear-assets"
            onSaved={refresh}
            hint="Dams are stored as assets of type Tailings dam, shared with the Linear Asset Risk Dashboard."
            fields={[
              { name: 'asset_reference', label: 'Reference' }, { name: 'asset_name', label: 'Dam name' },
              { name: 'operator', label: 'Operator' }, { name: 'country', label: 'Country' },
              { name: 'start_latitude', label: 'Latitude', type: 'number', step: 'any', min: -90, max: 90 },
              { name: 'start_longitude', label: 'Longitude', type: 'number', step: 'any', min: -180, max: 180 },
              { name: 'criticality', label: 'Criticality', options: ['Low', 'Moderate', 'High', 'Critical'], defaultValue: 'High' }
            ]}
            transform={(v) => ({ ...v, asset_type: 'Tailings dam', start_latitude: Number(v.start_latitude), start_longitude: Number(v.start_longitude) })}
          />
          <QuickForm
            key={`limit-${selectedRef}`}
            title="Manage warning limit"
            collection="insar-thresholds"
            onSaved={refresh}
            submitLabel="Set warning limit"
            hint={`Default warning limit is ${data.default_warning_limit_mm} mm; Critical is 2x the limit. A new rule replaces the previous one for the asset.`}
            fields={[
              { name: 'asset_reference', label: 'Dam reference', options: damOptions.length ? damOptions : ['(register a dam first)'], defaultValue: selectedRef || damOptions[0] || '' },
              { name: 'threshold_mm', label: 'Warning limit (mm)', type: 'number', min: '0.01', max: 100, step: '0.01', defaultValue: String(data.default_warning_limit_mm) },
              { name: 'notify_contact', label: 'Review contact email', type: 'email', required: false }
            ]}
            transform={(v) => {
              if (!damOptions.includes(v.asset_reference)) throw new Error('Register a dam first.');
              return { asset_reference: v.asset_reference, threshold_mm: Number(v.threshold_mm), enabled: true, notify_contact: v.notify_contact };
            }}
          />
          <QuickForm
            key={`obs-${selectedRef}`}
            title="Record InSAR observation"
            collection="insar-observations"
            onSaved={refresh}
            hint="Observations above the warning limit create an advisory alert automatically."
            fields={[
              { name: 'asset_reference', label: 'Dam reference', options: damOptions.length ? damOptions : ['(register a dam first)'], defaultValue: selectedRef || damOptions[0] || '' },
              { name: 'acquisition_date', label: 'Acquisition date', type: 'date' },
              { name: 'displacement_mm', label: 'Displacement (mm)', type: 'number', step: '0.01' },
              { name: 'velocity_mm_per_year', label: 'Velocity (mm/yr)', type: 'number', step: '0.01' },
              { name: 'coherence', label: 'Coherence (0-1)', type: 'number', min: 0, max: 1, step: '0.01' },
              { name: 'scene_reference', label: 'Scene / source reference' },
              { name: 'source', label: 'Source', options: ['Manual QA', 'Imported Sentinel-1', 'Synthetic demo'], defaultValue: 'Manual QA' }
            ]}
            transform={(v) => {
              if (!damOptions.includes(v.asset_reference)) throw new Error('Register a dam first.');
              return { ...v, displacement_mm: Number(v.displacement_mm), velocity_mm_per_year: Number(v.velocity_mm_per_year), coherence: Number(v.coherence) };
            }}
          />
        </div>
      </>}
    </div>
  );
}
