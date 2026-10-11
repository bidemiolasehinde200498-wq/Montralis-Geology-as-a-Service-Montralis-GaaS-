import React, { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { useAuth } from './auth/AuthContext';
import DriverSidebar from './components/driversidebar';
import GigMarketplace from './pages/gigmarketplace';
import ActiveTask from './pages/activetask';
import TelemetryUpload from './pages/telemetryupload';
import Calibration from './pages/calibration';
import Receipts from './pages/receipts';
import Login from './pages/Login';

const VIEWS = {
  marketplace: { title: 'Open gig marketplace', eyebrow: 'OPPORTUNITIES' },
  flight: { title: 'Active flight guidance', eyebrow: 'FIELD DISPATCH' },
  upload: { title: 'Upload sensor data', eyebrow: 'DATA INGESTION' },
  calibration: { title: 'Sensor calibration', eyebrow: 'REFERENCE CATALOG' },
  receipts: { title: 'Historical bank receipts', eyebrow: 'PAYOUT LEDGER' }
};

function Header({ view, user, onMenu, onLogout }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const page = VIEWS[view] || VIEWS.marketplace;
  return <header className="topbar">
    <button className="mobile-menu" onClick={onMenu} aria-label="Open navigation"><span>☰</span></button>
    <div className="topbar-crumb"><span>Logistics Hub</span><b>/</b><strong>{page.title}</strong></div>
    <div className="topbar-spacer" />
    <span className="topbar-terminal"><i /> FIELD OPS / CLIENT</span>
    <div className="profile-wrap">
      <button className="profile-button" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen}>
        <span className="pilot-avatar small">{user.name?.slice(0, 1).toUpperCase() || 'P'}</span><span className="profile-name">{user.name}</span><span className="chevron">⌄</span>
      </button>
      {profileOpen && <div className="profile-menu"><strong>{user.name}</strong><small>{user.email}</small><button onClick={onLogout}>Disconnect session</button></div>}
    </div>
  </header>;
}

function OverviewStrip({ discoveries, jobs, payoutTotal, live }) {
  const active = jobs.filter((job) => ['Assigned', 'In progress'].includes(job.status)).length;
  return <section className="overview-strip" aria-label="Logistics overview">
    <article><span className="overview-icon">◉</span><div><small>Available missions</small><strong>{discoveries.length}</strong></div></article>
    <article><span className="overview-icon">⌖</span><div><small>Active work tickets</small><strong>{active}</strong></div></article>
    <article><span className="overview-icon">£</span><div><small>Calculated payout ledger</small><strong>£{payoutTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div></article>
    <article><span className={`overview-icon ${live ? 'live-icon' : ''}`}>●</span><div><small>Engine handshake</small><strong className={live ? 'live-text' : 'offline-text'}>{live ? 'Connected' : 'Offline'}</strong></div></article>
  </section>;
}

export default function App() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState('marketplace');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('mtrl-logistics-collapsed') === '1');
  const [discoveries, setDiscoveries] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [minerals, setMinerals] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [live, setLive] = useState(false);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');
  const [toast, setToast] = useState('');

  const refresh = useCallback(async () => {
    if (!user) return;
    setError('');
    const [discoveryResult, jobResult, payoutResult, mineralResult] = await Promise.allSettled([
      api('/api/v1/gaas/discoveries'),
      api('/api/v1/portal/drone-dispatch'),
      api('/api/v1/billing/cooperative-payouts'),
      api('/api/v1/gaas/minerals')
    ]);
    if (discoveryResult.status === 'fulfilled') setDiscoveries(discoveryResult.value);
    if (jobResult.status === 'fulfilled') setJobs(jobResult.value);
    if (payoutResult.status === 'fulfilled') setPayouts(payoutResult.value.payouts || []);
    if (mineralResult.status === 'fulfilled') setMinerals(mineralResult.value);
    const failed = [discoveryResult, jobResult, payoutResult, mineralResult].find((result) => result.status === 'rejected');
    if (failed) {
      if (failed.reason?.status === 401) await logout();
      else setError(failed.reason?.message || 'Some logistics records could not be loaded.');
    }
    setLoadingData(false);
  }, [user, logout]);

  useEffect(() => {
    if (!user) {
      setDiscoveries([]); setJobs([]); setPayouts([]); setMinerals([]); setLoadingData(false);
      return undefined;
    }
    setLoadingData(true);
    refresh();
    const timer = setInterval(refresh, 45000);
    return () => clearInterval(timer);
  }, [user, refresh]);

  useEffect(() => {
    let active = true;
    const check = () => api('/api/v1/gaas/health').then(() => { if (active) setLive(true); }).catch(() => { if (active) setLive(false); });
    check();
    const timer = setInterval(check, 15000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const acceptMission = async (mission) => {
    if (user?.role !== 'MINING_COOPERATIVE') return;
    setSavingId(mission.id);
    setError('');
    try {
      const date = new Date().toISOString().slice(0, 10);
      const job = await api('/api/v1/portal/drone-dispatch', {
        method: 'POST',
        body: JSON.stringify({
          job_reference: `FIELD-${Date.now()}`,
          target_name: `${mission.mineral_target} · ${mission.country}`,
          latitude: Number(mission.latitude),
          longitude: Number(mission.longitude),
          contractor: user.name,
          scheduled_date: date,
          status: 'Assigned'
        })
      });
      setJobs((current) => [job, ...current]);
      setView('flight');
      setToast('Field-validation ticket created. No payout is attached to this request.');
    } catch (err) { setError(err.message || 'Could not request the field task.'); }
    finally { setSavingId(''); }
  };

  if (loading) return <div className="boot-screen"><span className="brand-mark">M</span><p>Establishing secure session…</p></div>;
  if (!user) return <Login />;

  const payoutTotal = payouts.reduce((sum, payout) => sum + Number(payout.calculated_payout_gbp || 0), 0);
  const setCollapsedState = () => setCollapsed((value) => {
    localStorage.setItem('mtrl-logistics-collapsed', value ? '0' : '1');
    return !value;
  });
  const page = view === 'flight'
    ? <ActiveTask jobs={jobs} loading={loadingData} />
    : view === 'upload'
      ? <TelemetryUpload />
      : view === 'calibration'
        ? <Calibration minerals={minerals} />
        : view === 'receipts'
          ? <Receipts payouts={payouts} loading={loadingData} />
          : <GigMarketplace discoveries={discoveries} loading={loadingData} onAccept={acceptMission} canAccept={user.role === 'MINING_COOPERATIVE'} savingId={savingId} />;

  return <div className="portal-shell">
    <DriverSidebar user={user} active={view} onNavigate={setView} onLogout={logout} live={live} gigs={discoveries.length} pending={payouts.filter((payout) => payout.payment_status === 'Pending').length} collapsed={collapsed} onToggle={setCollapsedState} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    <main className="portal-main">
      <Header view={view} user={user} onMenu={() => setMobileOpen(true)} onLogout={logout} />
      <div className="page-content">
        <OverviewStrip discoveries={discoveries} jobs={jobs} payoutTotal={payoutTotal} live={live} />
        {error && <div role="alert" className="global-error"><span>!</span>{error}<button onClick={refresh}>Retry</button></div>}
        {page}
        <footer className="app-footer"><span>MONTRALIS LOGISTICS HUB</span><span>Authenticated field workspace · Client records remain access-controlled</span></footer>
      </div>
    </main>
    {toast && <div role="status" className="toast-message">{toast}<button onClick={() => setToast('')} aria-label="Dismiss">×</button></div>}
  </div>;
}
