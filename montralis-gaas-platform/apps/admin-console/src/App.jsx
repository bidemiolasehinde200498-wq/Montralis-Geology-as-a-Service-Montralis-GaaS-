import React, { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import PlatformHealth from './pages/PlatformHealth';
import ServerDiagnostics from './pages/ServerDiagnostics';
import Billing from './pages/Billing';
import SecurityOverrides from './pages/SecurityOverrides';
import AdminWorkspaces from './pages/AdminWorkspaces';

export const NAV_SECTIONS = [
  { id: 'finance', label: 'Master Financial Ledger', items: [
    { id: 'revenue', label: 'Global Revenue Aggregator' },
    { id: 'offtake', label: 'Offtake Spread Monitor' },
    { id: 'royalties', label: 'Sovereign Royalty Tracker' },
    { id: 'healthcare', label: 'Healthcare Take-Rate Ledger' },
    { id: 'reports', label: 'Standalone Report Billing Matrix' }
  ] },
  { id: 'provisioning', label: 'User Provisioning & Onboarding', items: [
    { id: 'invites', label: 'Tokenized Invite Generator' },
    { id: 'accounts', label: 'Corporate Account Directory' },
    { id: 'renewals', label: 'SLA & Contract Renewals Audit' }
  ] },
  { id: 'spatial', label: 'Exploration AI & Spatial Data', items: [
    { id: 'spectral', label: 'Spectral Signature Matrix' },
    { id: 'coordinates', label: 'Sovereign Coordinate Vault' },
    { id: 'fusion', label: 'Data Fusion Pipeline Coordinator' },
    { id: 'mesh', label: '3D Structural Mesh Generator' }
  ] },
  { id: 'geotechnical', label: 'Geotechnical Risk & InSAR', items: [
    { id: 'radar', label: 'InSAR Radar Pipeline Status' },
    { id: 'thresholds', label: 'Deformation Alarm Configuration', roles: ['SYSTEM_ENGINEER', 'COMPLIANCE_MANAGER'] },
    { id: 'drones', label: 'Drone Operator Registry' }
  ] },
  { id: 'industrial', label: 'Downstream Integrations', items: [
    { id: 'factory', label: 'Gigafactory Captive Pipeline Mixer' },
    { id: 'vpp', label: 'Grid BESS & VPP OS Manager' }
  ] },
  { id: 'system', label: 'System Health, Security & Sovereignty', items: [
    { id: 'health', label: 'Global Microservice Log Stream' },
    { id: 'diagnostics', label: 'Server Diagnostics' },
    { id: 'boundary', label: 'Sovereign Data Boundary Toggler', roles: ['SYSTEM_ENGINEER', 'COMPLIANCE_MANAGER'] },
    { id: 'audit', label: 'Audit & Activity Logs' },
    { id: 'profile', label: 'Root Administrator Credentials' }
  ] }
];

export const NAV = NAV_SECTIONS.flatMap((section) => section.items);

export default function App() {
  const { user, loading } = useAuth();
  const [view, setView] = useState('health');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('mtrl-admin-nav-collapsed') === '1');
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-slate-500">Establishing secure link…</div>;
  }
  if (!user) return <Login />;

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(user.role))
  })).filter((section) => section.items.length > 0);
  const items = sections.flatMap((section) => section.items);
  const current = items.find((n) => n.id === view) || items[0];
  const Page = current.id === 'health' ? PlatformHealth : current.id === 'diagnostics' ? ServerDiagnostics : AdminWorkspaces;
  const pageProps = current.id === 'health' || current.id === 'diagnostics' ? {} : { view: current.id };

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      localStorage.setItem('mtrl-admin-nav-collapsed', value ? '0' : '1');
      return !value;
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0e10] font-sans text-slate-100">
      <Sidebar
        sections={sections}
        currentView={current.id}
        setView={setView}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapsed}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.055),transparent_48%)]">
        <TopBar view={current.id} sections={sections} onNavigate={setView} onOpenMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <Page {...pageProps} />
          </div>
        </main>
      </div>
    </div>
  );
}
