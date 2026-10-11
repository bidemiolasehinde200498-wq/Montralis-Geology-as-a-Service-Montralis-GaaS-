import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../components/icons';

const fieldClass = 'w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none';

function Heading({ title, subtitle, note }) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-slate-400">{subtitle}</p>
      {note && <p className="text-xs text-amber-400">{note}</p>}
    </header>
  );
}

function displayValue(value) {
  if (value == null || value === '') return '—';
  if (typeof value === 'number') return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return value;
}

export function RecordWorkspace({ title, subtitle, collection, fields, columns, note, transform }) {
  const { logout } = useAuth();
  const [records, setRecords] = useState([]);
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ''])));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refresh = async () => {
    try {
      const endpoint = collection === 'cooperative-payouts'
        ? '/api/v1/billing/cooperative-payouts'
        : `/api/v1/portal/${collection}`;
      const data = await api(endpoint);
      setRecords(Array.isArray(data) ? data : data.payouts || []);
      setError('');
    } catch (err) {
      if (err.status === 401) logout();
      else setError(err.status === 403 ? 'Your account does not have access to this workspace.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [collection]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const saved = await api(`/api/v1/portal/${collection}`, {
        method: 'POST',
        body: JSON.stringify(transform ? transform(values) : values)
      });
      setRecords((current) => [saved, ...current]);
      setValues(Object.fromEntries(fields.map((f) => [f.name, f.defaultValue ?? ''])));
      setSuccess('Record saved to the shared platform ledger.');
    } catch (err) {
      if (err.status === 401) logout();
      else setError(err.message || 'Could not save this record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <Heading title={title} subtitle={subtitle} note={note} />
      <form onSubmit={submit} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-4">
        <h2 className="text-sm font-semibold text-slate-300">Add record</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {fields.map((field) => (
            <label key={field.name} className="block space-y-1">
              <span className="text-xs font-semibold uppercase text-slate-500">{field.label}</span>
              {field.options ? (
                <select required={field.required !== false} value={values[field.name]} className={fieldClass}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}>
                  {field.placeholder && <option value="">{field.placeholder}</option>}
                  {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <input required={field.required !== false} type={field.type || 'text'} min={field.min} max={field.max}
                  step={field.step} placeholder={field.placeholder} value={values[field.name]} className={fieldClass}
                  onChange={(e) => setValues({ ...values, [field.name]: e.target.value })} />
              )}
            </label>
          ))}
        </div>
        {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
        {success && <p role="status" className="text-sm text-emerald-400">{success}</p>}
        <button disabled={saving} className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-semibold px-4 py-2 rounded">
          {saving ? 'Saving…' : 'Save record'}
        </button>
      </form>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Ledger records</h2>
          <button onClick={refresh} className="text-xs text-emerald-400 hover:text-emerald-300">Refresh</button>
        </div>
        {loading ? <p className="text-sm text-slate-500">Loading records…</p> : records.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-8 text-center text-sm text-slate-500">No records yet.</div>
        ) : (
          <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-lg">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
                <tr>{columns.map((column) => <th key={column.key} className="px-4 py-3 text-left">{column.label}</th>)}</tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-t border-slate-800">
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3">
                        {column.render ? column.render(record) : displayValue(record[column.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const field = (name, label, type, extra = {}) => ({ name, label, ...(type ? { type } : {}), ...extra });
const status = (name, label, options, defaultValue) => ({ name, label, options, defaultValue });

export function CadastreRegistry() {
  return <RecordWorkspace title="Sovereign Cadastre Registry" subtitle="Mining-license and concession register for authorised government users." collection="cadastre-registry"
    fields={[field('license_number', 'License number'), field('license_holder', 'License holder'), field('country', 'Country'), field('area_name', 'Concession / area'), field('mineral', 'Mineral'), field('boundary_reference', 'Boundary reference'), status('application_status', 'Application status', ['Submitted', 'Under review', 'Active', 'Suspended', 'Expired'], 'Submitted'), field('renewal_date', 'Renewal date', 'date', { required: false })]}
    columns={[{ key: 'license_number', label: 'License' }, { key: 'license_holder', label: 'Holder' }, { key: 'country', label: 'Country' }, { key: 'area_name', label: 'Concession' }, { key: 'mineral', label: 'Mineral' }, { key: 'application_status', label: 'Status' }, { key: 'renewal_date', label: 'Renewal' }]} />;
}

export function CustomsExportPortal() {
  return <RecordWorkspace title="Customs Export Portal" subtitle="Border shipment ledger with declared weights, purity readings and approval state." collection="customs-export"
    note="Purity readings are entered records; no IoT sensor integration is connected yet. Export stamps are recorded statuses, not government approvals."
    fields={[field('shipment_reference', 'Shipment reference'), field('mineral', 'Mineral'), field('exporter', 'Exporter'), field('country', 'Country'), field('origin', 'Origin'), field('destination', 'Destination'), field('raw_weight_tonnes', 'Raw weight (tonnes)', 'number', { min: '0.001', step: '0.001' }), field('purity_percent', 'Purity (%)', 'number', { min: 0, max: 100, step: '0.01' }), field('declared_value_gbp', 'Declared value (GBP)', 'number', { min: 0, step: '0.01' }), status('approval_status', 'Export status', ['Pending', 'Approved', 'Held', 'Rejected'], 'Pending'), field('crossing_date', 'Crossing date', 'date', { required: false })]}
    columns={[{ key: 'shipment_reference', label: 'Shipment' }, { key: 'mineral', label: 'Mineral' }, { key: 'raw_weight_tonnes', label: 'Weight (t)' }, { key: 'purity_percent', label: 'Purity %' }, { key: 'declared_value_gbp', label: 'Declared value £' }, { key: 'approval_status', label: 'Status' }, { key: 'crossing_date', label: 'Crossing date' }]} />;
}

export function BorderRoyaltiesLedger() {
  const { logout } = useAuth();
  const [ledger, setLedger] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api('/api/v1/billing/royalties').then(setLedger).catch((err) => {
      if (err.status === 401) logout();
      else setError(err.message);
    });
  }, [logout]);
  return (
    <div className="space-y-6 max-w-5xl">
      <Heading title="Border Processing Royalties Ledger" subtitle="Calculated 1.5% processing fee against customs shipment declarations."
        note="Calculated estimates only; no tax assessment, invoice or funds transfer is issued by this portal." />
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
      {!ledger ? <p className="text-sm text-slate-500">Loading royalty ledger…</p> : <>
        <div className="max-w-sm bg-slate-950 border border-slate-800 rounded-lg p-5">
          <p className="text-xs uppercase text-slate-500">Calculated fees at 1.5%</p>
          <p className="text-3xl font-semibold text-emerald-400">£{ledger.total_due_gbp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-500">{ledger.shipments.length} customs declarations</p>
        </div>
        <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-lg">
          <table className="w-full text-sm"><thead className="bg-slate-900 text-slate-400 text-xs uppercase"><tr>
            {['Shipment', 'Mineral', 'Weight (t)', 'Declared value', 'Fee (1.5%)', 'Approval'].map((x) => <th key={x} className="px-4 py-3 text-left">{x}</th>)}
          </tr></thead><tbody>
            {ledger.shipments.map((r) => <tr key={r.id} className="border-t border-slate-800">
              <td className="px-4 py-3">{r.shipment_reference}</td><td className="px-4 py-3">{r.mineral}</td>
              <td className="px-4 py-3">{displayValue(r.raw_weight_tonnes)}</td>
              <td className="px-4 py-3">£{r.declared_value_gbp.toLocaleString()}</td>
              <td className="px-4 py-3 text-emerald-400">£{r.royalty_due_gbp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="px-4 py-3">{r.approval_status}</td>
            </tr>)}
            {ledger.shipments.length === 0 && <tr><td colSpan="6" className="p-6 text-center text-slate-500">No customs declarations to calculate yet.</td></tr>}
          </tbody></table>
        </div>
      </>}
    </div>
  );
}

export function OfftakeEscrowHub() {
  return <RecordWorkspace title="Digital Offtake Escrow Hub" subtitle="Draft offtake terms linked to a named target area and coordinates."
    note="Records remain drafts. Legal execution, escrow custody, e-signatures and export rights are not integrated."
    collection="offtake-contracts"
    fields={[field('contract_reference', 'Contract reference'), field('mineral', 'Mineral'), field('country', 'Country'), field('target_area', 'Target area'), field('latitude', 'Latitude', 'number', { min: -90, max: 90, step: 'any' }), field('longitude', 'Longitude', 'number', { min: -180, max: 180, step: 'any' }), field('volume_tonnes', 'Volume (tonnes)', 'number', { min: '0.001', step: '0.001' }), field('price_per_tonne_gbp', 'Offer price (£/tonne)', 'number', { min: 0, step: '0.01' }), field('counterparty', 'Counterparty'), status('status', 'Draft status', ['Draft', 'Pending signatures', 'Signed', 'Closed'], 'Draft')]}
    columns={[{ key: 'contract_reference', label: 'Contract' }, { key: 'mineral', label: 'Mineral' }, { key: 'target_area', label: 'Target area' }, { key: 'volume_tonnes', label: 'Volume (t)' }, { key: 'price_per_tonne_gbp', label: 'Offer £/t' }, { key: 'counterparty', label: 'Counterparty' }, { key: 'status', label: 'Status' }]} />;
}

export function DroneDispatch() {
  return <RecordWorkspace title="Drone & Field Validation Dispatch" subtitle="Create and track field-validation requests against exploration coordinates."
    note="Contractor dispatch and drone data ingestion are not connected; saved jobs are platform work tickets only."
    collection="drone-dispatch"
    fields={[field('job_reference', 'Job reference'), field('target_name', 'Target name'), field('latitude', 'Latitude', 'number', { min: -90, max: 90, step: 'any' }), field('longitude', 'Longitude', 'number', { min: -180, max: 180, step: 'any' }), field('contractor', 'Contractor'), field('scheduled_date', 'Scheduled date', 'date', { required: false }), status('status', 'Status', ['Open', 'Assigned', 'In progress', 'Complete', 'Cancelled'], 'Open')]}
    columns={[{ key: 'job_reference', label: 'Job' }, { key: 'target_name', label: 'Target' }, { key: 'latitude', label: 'Latitude' }, { key: 'longitude', label: 'Longitude' }, { key: 'contractor', label: 'Contractor' }, { key: 'scheduled_date', label: 'Scheduled' }, { key: 'status', label: 'Status' }]} />;
}

export function LogisticsPipeline() {
  return <RecordWorkspace title="Refined Logistical Pipeline" subtitle="Track declared mineral shipments between mine, processing plant and port." collection="logistics-pipeline"
    note="Locations and statuses are manually recorded; live GPS, carrier and port feeds are not connected."
    fields={[field('shipment_reference', 'Shipment reference'), field('mineral', 'Mineral'), field('origin', 'Mine / origin'), field('destination', 'Plant / port destination'), field('weight_tonnes', 'Weight (tonnes)', 'number', { min: '0.001', step: '0.001' }), status('status', 'Status', ['At mine', 'In transit', 'At plant', 'At port', 'Delivered'], 'At mine')]}
    columns={[{ key: 'shipment_reference', label: 'Shipment' }, { key: 'mineral', label: 'Mineral' }, { key: 'origin', label: 'Origin' }, { key: 'destination', label: 'Destination' }, { key: 'weight_tonnes', label: 'Weight (t)' }, { key: 'status', label: 'Status' }]} />;
}

export function CooperativePayoutLedger() {
  return <RecordWorkspace title="Cooperative Payout Ledger" subtitle="Recorded mine weigh tickets with a configurable £530/tonne payout calculation."
    note="Calculated amounts are estimates from manually entered weights; IoT scale and mobile-money disbursement integrations are not connected."
    collection="cooperative-payouts"
    fields={[field('weigh_ticket', 'Weigh ticket'), field('mineral', 'Mineral'), field('mine_site', 'Mine site'), field('weight_tonnes', 'Raw weight (tonnes)', 'number', { min: '0.001', step: '0.001' }), field('payout_rate_gbp_per_tonne', 'Payout rate (£/tonne)', 'number', { min: '0.01', step: '0.01', defaultValue: '530' }), status('payment_status', 'Record status', ['Pending', 'Recorded', 'Paid'], 'Pending')]}
    columns={[{ key: 'weigh_ticket', label: 'Weigh ticket' }, { key: 'mineral', label: 'Mineral' }, { key: 'mine_site', label: 'Mine site' }, { key: 'weight_tonnes', label: 'Weight (t)' }, { key: 'calculated_payout_gbp', label: 'Calculated payout £', render: (r) => `£${Number(r.calculated_payout_gbp).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }, { key: 'payment_status', label: 'Status' }]} />;
}

export function CompanySettings() {
  return <RecordWorkspace title="Company Settings Terminal" subtitle="Maintain this account's organization metadata and team provisioning policy."
    note="API endpoint and provider values are saved as configuration metadata; no API secrets are stored or changed here."
    collection="organization-settings"
    fields={[field('organization_name', 'Organization name'), field('registered_country', 'Registered country'), field('registration_reference', 'Registration reference', null, { required: false }), field('contact_email', 'Contact email', 'email', { required: false }), status('seat_provisioning', 'Team provisioning', ['Admins only', 'Admins and owners'], 'Admins only'), status('api_environment', 'API environment', ['Sandbox', 'Production'], 'Sandbox'), status('data_provider', 'Geospatial data provider', ['AWS Open Data', 'Google Earth Engine', 'USGS Landsat', 'Copernicus'], 'AWS Open Data'), field('api_endpoint', 'API endpoint', 'url', { required: false })]}
    columns={[{ key: 'organization_name', label: 'Organization' }, { key: 'registered_country', label: 'Country' }, { key: 'registration_reference', label: 'Registration' }, { key: 'contact_email', label: 'Contact' }, { key: 'seat_provisioning', label: 'Provisioning policy' }, { key: 'api_environment', label: 'API environment' }, { key: 'data_provider', label: 'Provider' }, { key: 'api_endpoint', label: 'Endpoint' }]} />;
}

export function SovereignCompliance() {
  return <RecordWorkspace title="Privacy & Sovereign Compliance Hub" subtitle="Record jurisdictional controls, consent and compliance review status."
    note="This workspace records review references only; it is not legal advice, a compliance certification, or a consent-signature service."
    collection="compliance-events"
    fields={[field('jurisdiction', 'Jurisdiction'), status('control_domain', 'Control domain', ['Data localisation', 'Maritime trade codes', 'Resource nationalism', 'User consent', 'Other'], 'Other'), field('control_reference', 'Control / code reference'), status('review_status', 'Review status', ['Open', 'In review', 'Resolved'], 'Open'), status('consent_status', 'Consent status', ['Not applicable', 'Pending', 'Recorded'], 'Not applicable'), field('evidence_reference', 'Evidence reference', null, { required: false }), field('notes', 'Review notes', null, { required: false })]}
    columns={[{ key: 'jurisdiction', label: 'Jurisdiction' }, { key: 'control_domain', label: 'Control domain' }, { key: 'control_reference', label: 'Control reference' }, { key: 'review_status', label: 'Status' }, { key: 'consent_status', label: 'Consent' }, { key: 'evidence_reference', label: 'Evidence' }, { key: 'notes', label: 'Notes' }, { key: 'created_at', label: 'Recorded at' }]} />;
}

export function SubscriptionBilling() {
  return <RecordWorkspace title="Subscription Billing Panel" subtitle="Select an account tier and record the preferred billing route."
    note="Plan changes are recorded locally only; checkout, bank wires, card updates and renewals are not connected."
    collection="subscription-settings"
    fields={[status('plan', 'Plan', ['Starter', 'Professional', 'Enterprise'], 'Starter'), status('billing_method', 'Billing method', ['Invoice', 'Bank wire', 'Card'], 'Invoice'), field('billing_contact', 'Billing contact', 'email', { required: false })]}
    columns={[{ key: 'plan', label: 'Plan' }, { key: 'billing_method', label: 'Billing method' }, { key: 'billing_contact', label: 'Billing contact' }, { key: 'updated_at', label: 'Updated' }]} />;
}

export function NotificationsButton() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`mtrl-read-${user.email}`) || '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    let active = true;
    const refresh = () => api('/api/v1/portal/notifications').then((data) => { if (active) setEvents(data); }).catch((err) => { if (err.status === 401) logout(); });
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [logout]);

  const unread = events.filter((event) => !readIds.includes(event.id)).length;
  const markRead = () => {
    const ids = events.map((event) => event.id);
    setReadIds(ids);
    localStorage.setItem(`mtrl-read-${user.email}`, JSON.stringify(ids));
  };

  return (
    <div className="relative">
      <button aria-expanded={open} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} onClick={() => { setOpen(!open); if (!open) markRead(); }}
        className="relative rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10">
        <Icon name="bell" className="h-5 w-5" />
        {unread > 0 && <span className="absolute -right-1.5 -top-1.5 min-w-[18px] rounded-full bg-emerald-500 px-1 text-center text-[10px] font-bold leading-[18px] text-slate-950">{unread}</span>}
      </button>
      {open && <div className="absolute right-0 top-12 z-40 max-h-96 w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <button onClick={() => setOpen(false)} aria-label="Close notifications" className="text-slate-400 hover:text-white">×</button>
        </div>
        {events.length === 0 ? <p className="p-4 text-sm text-slate-500">No recent events.</p> : events.map((event) => (
          <article key={event.id} className="border-b border-slate-800 px-4 py-3">
            <p className="text-sm text-slate-200">{event.title}</p>
            <p className="mt-1 text-xs text-slate-400">{event.detail}</p>
            <time className="mt-1 block text-[11px] text-slate-600">{new Date(event.occurred_at).toLocaleString()}</time>
          </article>
        ))}
      </div>}
    </div>
  );
}
