import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';

const PANEL = 'rounded-lg border border-slate-800 bg-slate-950';
const CONTROL = 'w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100';

const TITLES = {
  revenue: 'Global Revenue Aggregator', offtake: 'Offtake Spread Monitor', royalties: 'Sovereign Royalty Tracker',
  healthcare: 'Healthcare Take-Rate Ledger', reports: 'Standalone Report Billing Matrix', invites: 'Tokenized Invite Generator',
  accounts: 'Corporate Account Directory', renewals: 'SLA & Contract Renewals Audit', spectral: 'Spectral Signature Matrix',
  coordinates: 'Sovereign Coordinate Vault', fusion: 'Data Fusion Pipeline Coordinator', mesh: '3D Structural Vector Mesh Generator',
  radar: 'InSAR Radar Pipeline Status', thresholds: 'Deformation Alarm Configuration', drones: 'Drone Operator Registry',
  factory: 'Gigafactory Captive Pipeline Mixer', vpp: 'Grid BESS & VPP OS Manager', health: 'Global Microservice Log Stream',
  boundary: 'Sovereign Data Boundary Toggler', audit: 'Audit & Activity Logs', profile: 'Root Administrator Credentials'
};

function Table({ columns, rows, empty = 'No records available.' }) {
  if (!rows?.length) return <div className={`${PANEL} px-4 py-8 text-center text-sm text-slate-500`}>{empty}</div>;
  return <div className={`${PANEL} overflow-x-auto`}><table className="w-full min-w-[700px] text-sm">
    <thead className="bg-slate-900 text-left text-xs uppercase text-slate-400"><tr>{columns.map((c) => <th key={c.key} className="px-4 py-3">{c.label}</th>)}</tr></thead>
    <tbody>{rows.map((row, index) => <tr key={row.id || row.email || row.asset_reference || row.title || index} className="border-t border-slate-800">
      {columns.map((c) => <td key={c.key} className="px-4 py-3 align-top">{c.render ? c.render(row) : row[c.key] ?? '—'}</td>)}
    </tr>)}</tbody>
  </table></div>;
}

function Metric({ label, value, detail }) {
  return <div className={`${PANEL} p-4`}><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold text-slate-100">{value}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</div>;
}

function Notice({ children, tone = 'amber' }) {
  const styles = tone === 'rose' ? 'border-rose-500/30 text-rose-300' : 'border-amber-500/30 text-amber-300';
  return <p className={`rounded border bg-slate-950 px-4 py-3 text-sm ${styles}`}>{children}</p>;
}

function AdminHeader({ title, subtitle }) {
  return <header className="space-y-1"><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-slate-400">{subtitle}</p></header>;
}

function AdminThresholds({ data, refresh }) {
  const [threshold, setThreshold] = useState('2.5');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const save = async (e) => {
    e.preventDefault(); setError(''); setStatus('');
    try {
      await api('/api/v1/portal/admin-settings', { method: 'POST', body: JSON.stringify({ setting_key: 'insar-default-threshold-mm', value: Number(threshold) }) });
      setStatus('Default threshold saved. This affects fallback rules only; explicit asset rules remain separate.');
      refresh();
    } catch (err) { setError(err.message); }
  };
  const current = [...(data?.admin_settings || [])].reverse().find((item) => item.setting_key === 'insar-default-threshold-mm');
  return <div className="space-y-5">
    <AdminHeader title={TITLES.thresholds} subtitle="Set the account-independent fallback threshold for new InSAR observations." />
    <Notice>Threshold notifications require valid, calibrated displacement observations. They are advisory; no valves, breakers or grid controls are actuated.</Notice>
    <form onSubmit={save} className={`${PANEL} max-w-xl space-y-4 p-4`}>
      <p className="text-sm text-slate-300">Current fallback: <strong>{current?.value ?? 2.5} mm</strong></p>
      <label className="block space-y-1 text-xs uppercase text-slate-500"><span>New default threshold (mm)</span><input type="number" min="0.01" max="100" step="0.01" value={threshold} onChange={(e) => setThreshold(e.target.value)} className={CONTROL} /></label>
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}{status && <p role="status" className="text-sm text-emerald-400">{status}</p>}
      <button className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold">Save fallback</button>
    </form>
    <Table columns={[{ key: 'owner_email', label: 'Configured by' }, { key: 'asset_reference', label: 'Asset' }, { key: 'threshold_mm', label: 'Threshold mm' }, { key: 'enabled', label: 'Enabled' }]} rows={data?.insar_thresholds || []} />
  </div>;
}

function AdminBoundary({ data, refresh }) {
  const [settings, setSettings] = useState({ EU: 'London', Africa: 'Johannesburg', Americas: 'Virginia' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const latest = [...(data?.admin_settings || [])].reverse().find((x) => x.setting_key === 'data-boundary-rules');
    if (latest?.value && typeof latest.value === 'object') setSettings(latest.value);
  }, [data]);
  const save = async () => {
    setError(''); setMessage('');
    try {
      await api('/api/v1/portal/admin-settings', { method: 'POST', body: JSON.stringify({ setting_key: 'data-boundary-rules', value: settings }) });
      setMessage('Boundary metadata saved. Enforcement and cloud-region pinning are not connected.');
      refresh();
    } catch (err) { setError(err.message); }
  };
  return <div className="space-y-5">
    <AdminHeader title={TITLES.boundary} subtitle="Record intended data-localisation regions for review." />
    <Notice>These settings are metadata only. They do not route or localise data, and are not evidence of GDPR, HIPAA or sovereign compliance.</Notice>
    <div className={`${PANEL} max-w-xl space-y-4 p-4`}>
      {Object.entries(settings).map(([region, location]) => <label key={region} className="block space-y-1 text-xs uppercase text-slate-500"><span>{region} storage region</span><input value={location} onChange={(e) => setSettings({ ...settings, [region]: e.target.value })} className={CONTROL} /></label>)}
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}{message && <p role="status" className="text-sm text-emerald-400">{message}</p>}
      <button onClick={save} className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold">Save boundary metadata</button>
    </div>
  </div>;
}

function AdminMeshTest() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const run = async () => {
    setStatus(''); setError('');
    try {
      const mesh = await api('/api/v1/gaas/fusion/mesh-preview', { method: 'POST', body: JSON.stringify({ bounds: [29, -20, 29.1, -19.9], layers: { qa_grid: [[1, 2], [3, 4]] } }) });
      setStatus(`Preview generated: ${mesh.valid_vertex_count} vertices and ${mesh.faces.length} triangles.`);
    } catch (err) { setError(err.message); }
  };
  return <div className="space-y-5"><AdminHeader title={TITLES.mesh} subtitle="Run a small mesh-generation smoke test on provided numeric raster values." />
    <Notice>Test values are synthetic. This output is a relative surface mesh, not a depth model or subsurface geology interpretation.</Notice>
    <div className={`${PANEL} space-y-4 p-4`}><button onClick={run} className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold">Run mesh smoke test</button>{status && <p role="status" className="text-sm text-emerald-400">{status}</p>}{error && <p role="alert" className="text-sm text-rose-400">{error}</p>}</div>
  </div>;
}

function DataPage({ view, data, minerals, countries, sources, refresh }) {
  const title = TITLES[view] || 'Admin Workspace';
  const quotes = data?.report_quotes_total_gbp ?? 0;
  if (view === 'revenue') return <div className="space-y-5"><AdminHeader title={title} subtitle="Staff-only financial overview from records currently stored in the platform." />
    <Notice>These are calculated estimates and report fee quotes, not booked revenue or collected cash.</Notice>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Measured revenue" value="Unavailable" detail="No settlement ledger integrated" />
      <Metric label="Border fee estimate" value={`£${data?.royalty_estimate?.calculated_fee_gbp?.toLocaleString() ?? '0.00'}`} detail="1.5% of entered customs declarations" />
      <Metric label="Report quotes" value={`£${quotes.toLocaleString()}`} detail={`${data?.report_jobs?.length ?? 0} generated reports; not invoiced`} />
      <Metric label="Payout estimate" value={`£${data?.cooperative_payout_estimate_gbp?.toLocaleString() ?? '0.00'}`} detail="Entered tonnage × configured rate" />
    </div>
    <p className="text-xs text-slate-500">{data?.revenue_note}</p>
  </div>;
  if (view === 'offtake') return <div className="space-y-5"><AdminHeader title={title} subtitle="Recorded draft contract volumes; no realized trade margins are available." /><Notice>{data?.offtake?.status || 'Pricing feed is not connected.'}</Notice><div className="grid gap-3 sm:grid-cols-2"><Metric label="Recorded contracts" value={data?.offtake?.contracts_count ?? 0} /><Metric label="Contracted volume" value={`${data?.offtake?.contracted_volume_tonnes ?? 0} t`} /></div><Table columns={[{ key: 'contract_reference', label: 'Contract' }, { key: 'country', label: 'Country' }, { key: 'mineral', label: 'Mineral' }, { key: 'volume_tonnes', label: 'Volume t' }, { key: 'price_per_tonne_gbp', label: 'Offer £/t' }, { key: 'status', label: 'Status' }]} rows={data?.offtake_contracts || []} /></div>;
  if (view === 'royalties') return <div className="space-y-5"><AdminHeader title={title} subtitle="Estimated 1.5% fee from customs declared values." /><Notice>Calculated estimate only; no government assessment, invoice or fee settlement is connected.</Notice><Metric label="Calculated fee" value={`£${data?.royalty_estimate?.calculated_fee_gbp?.toLocaleString() ?? '0.00'}`} detail={`Declared value total £${data?.royalty_estimate?.declared_export_value_gbp?.toLocaleString() ?? '0.00'}`} /><Table columns={[{ key: 'shipment_reference', label: 'Shipment' }, { key: 'country', label: 'Country' }, { key: 'mineral', label: 'Mineral' }, { key: 'declared_value_gbp', label: 'Declared value £' }, { key: 'approval_status', label: 'Status' }]} rows={data?.customs_shipments || []} /></div>;
  if (view === 'healthcare') return <div className="space-y-5"><AdminHeader title={title} subtitle="Healthcare settlement and platform fee status." /><Notice>{data?.healthcare_take_rate?.status}</Notice><Metric label="Configured take-rate" value="2%" detail="Applied by demo clearing endpoint only; no persistent settlement records" /></div>;
  if (view === 'reports') return <div className="space-y-5"><AdminHeader title={title} subtitle="Audit generated encrypted report requests and optional fee quotes." /><Notice>Quotes do not mean invoices were issued or paid. The billing system is not connected.</Notice><Metric label="Quoted total" value={`£${quotes.toLocaleString()}`} /><Table columns={[{ key: 'owner_email', label: 'Requested by' }, { key: 'report_type', label: 'Type' }, { key: 'title', label: 'Title' }, { key: 'fee_quote_gbp', label: 'Fee quote £' }, { key: 'invoice_status', label: 'Invoice status' }, { key: 'created_at', label: 'Generated' }]} rows={data?.report_jobs || []} /></div>;
  if (view === 'invites') return <div className="space-y-5"><AdminHeader title={title} subtitle="Closed B2B account provisioning." /><Notice>Invite creation/redemption and email delivery are not implemented. Demo accounts are provisioned through the auth-hub seed-user command.</Notice><p className="text-sm text-slate-400">Do not share seed credentials with external clients. Add an invitation API with hashed, single-use tokens before onboarding real partners.</p></div>;
  if (view === 'accounts') return <div className="space-y-5"><AdminHeader title={title} subtitle="Registered accounts, portal and assigned profile tag." /><Table columns={[{ key: 'email', label: 'Email' }, { key: 'name', label: 'Name' }, { key: 'profile_tag', label: 'Profile tag' }, { key: 'portal', label: 'Portal' }, { key: 'title', label: 'Title' }]} rows={data?.accounts || []} /></div>;
  if (view === 'renewals') return <div className="space-y-5"><AdminHeader title={title} subtitle="Stored subscription profile snapshots and renewal dates." /><Notice>Renewal dates are self-reported settings; no SLA contract or subscription payment provider is connected.</Notice><Table columns={[{ key: 'owner_email', label: 'Account' }, { key: 'plan', label: 'Plan' }, { key: 'billing_method', label: 'Method' }, { key: 'billing_contact', label: 'Billing contact' }, { key: 'renewal_date', label: 'Renewal date' }]} rows={data?.subscriptions || []} /></div>;
  if (view === 'spectral') return <div className="space-y-5"><AdminHeader title={title} subtitle="Read-only spectral profile catalog currently served to the client portal." /><Notice>Profiles are view-only here; changing mineral formulas requires reviewed configuration deployment.</Notice><Table columns={[{ key: 'classification', label: 'Class' }, { key: 'name', label: 'Element' }, { key: 'symbol', label: 'Symbol' }, { key: 'primary_sensor_bands', label: 'Bands' }, { key: 'sentinel2_mode', label: 'Sentinel-2 mode' }, { key: 'sentinel2_note', label: 'Sensor note' }]} rows={minerals} /></div>;
  if (view === 'coordinates') return <div className="space-y-5"><AdminHeader title={title} subtitle="Read-only country reference points, bounds and mapped mineral districts." /><Table columns={[{ key: 'name', label: 'Country' }, { key: 'lat', label: 'Reference latitude' }, { key: 'lng', label: 'Reference longitude' }, { key: 'bbox', label: 'Bounds W,S,E,N', render: (r) => r.bbox.join(', ') }, { key: 'areas', label: 'Mapped targets', render: (r) => r.areas.map((x) => `${x.name} (${x.minerals.join('/')})`).join('; ') || '—' }]} rows={countries} /></div>;
  if (view === 'fusion' || view === 'radar') return <div className="space-y-5"><AdminHeader title={title} subtitle="Public data-source readiness reported by the spectral service." /><Table columns={[{ key: 'label', label: 'Source' }, { key: 'connected', label: 'Available', render: (r) => r.connected ? 'Available' : 'Not connected' }, { key: 'status', label: 'Readiness' }, { key: 'description', label: 'Notes' }]} rows={sources} /></div>;
  if (view === 'mesh') return <AdminMeshTest />;
  if (view === 'thresholds') return <AdminThresholds data={data} refresh={refresh} />;
  if (view === 'drones') return <div className="space-y-5"><AdminHeader title={title} subtitle="Contractor names and work tickets entered through the client portal." /><Notice>There is no pilot verification, live map position, raw-data ingestion or payment settlement integration.</Notice><Table columns={[{ key: 'owner_email', label: 'Account' }, { key: 'job_reference', label: 'Job' }, { key: 'contractor', label: 'Contractor' }, { key: 'target_name', label: 'Target' }, { key: 'status', label: 'Status' }, { key: 'scheduled_date', label: 'Scheduled' }]} rows={data?.drone_jobs || []} /></div>;
  if (view === 'factory' || view === 'vpp') return <div className="space-y-5"><AdminHeader title={title} subtitle="Downstream energy and manufacturing telemetry status." /><Notice>No gigafactory, BESS fleet, grid trading or VPP telemetry source is connected. This page does not report live assets.</Notice></div>;
  if (view === 'boundary') return <AdminBoundary data={data} refresh={refresh} />;
  if (view === 'audit') return <div className="space-y-5"><AdminHeader title={title} subtitle="Persisted compliance and review entries from client workspaces." /><Notice>These are user-entered records, not an immutable audit log or a compliance certification.</Notice><Table columns={[{ key: 'owner_email', label: 'Account' }, { key: 'jurisdiction', label: 'Jurisdiction' }, { key: 'control_domain', label: 'Domain' }, { key: 'control_reference', label: 'Control' }, { key: 'review_status', label: 'Status' }, { key: 'consent_status', label: 'Consent' }]} rows={data?.compliance_events || []} /></div>;
  if (view === 'profile') return <div className="space-y-5"><AdminHeader title={title} subtitle="Current authenticated staff account." /><div className={`${PANEL} max-w-xl space-y-2 p-4`}><p>{data?.current_user?.name}</p><p className="text-sm text-slate-400">{data?.current_user?.email}</p><p className="text-sm text-rose-300">{data?.current_user?.role} · {data?.current_user?.title}</p></div></div>;
  return <div className="space-y-5"><AdminHeader title={title} subtitle="Operational view backed by the current platform APIs." /><Metric label="Stored portal records" value={Object.values(data?.record_counts || {}).reduce((a, b) => a + b, 0)} /></div>;
}

export default function AdminWorkspaces({ view }) {
  const { logout, user } = useAuth();
  const [data, setData] = useState(null);
  const [minerals, setMinerals] = useState([]);
  const [countries, setCountries] = useState([]);
  const [sources, setSources] = useState([]);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const refresh = () => setReload((count) => count + 1);

  useEffect(() => {
    let active = true;
    Promise.all([
      api('/api/v1/admin/control-plane'),
      api('/api/v1/gaas/minerals'),
      api('/api/v1/gaas/countries'),
      api('/api/v1/gaas/fusion-sources')
    ]).then(([admin, mineralRows, countryRows, sourceRows]) => {
      if (!active) return;
      setData({ ...admin, current_user: user }); setMinerals(mineralRows); setCountries(countryRows); setSources(sourceRows); setError('');
    }).catch((err) => {
      if (!active) return;
      if (err.status === 401) logout();
      else setError(err.message || 'Unable to load admin control-plane data.');
    });
    return () => { active = false; };
  }, [logout, reload, user]);

  return <div className="space-y-4">
    <div className="flex items-center justify-between"><p className="text-xs text-slate-500">Admin control-plane snapshot · {data?.generated_at || 'Loading'}</p><button onClick={refresh} className="text-xs text-rose-300 hover:text-rose-200">Refresh data</button></div>
    {error && <Notice tone="rose">{error}</Notice>}
    {!data ? <p className="text-sm text-slate-500">Loading admin control-plane…</p> : <DataPage view={view} data={data} minerals={minerals} countries={countries} sources={sources} refresh={refresh} />}
  </div>;
}
