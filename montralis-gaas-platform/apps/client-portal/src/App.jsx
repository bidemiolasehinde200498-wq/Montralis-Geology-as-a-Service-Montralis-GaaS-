import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { defaultView, NAV_ITEMS, segmentsFor } from './navigation';
import Login from './pages/Login';
import NavSidebar from './components/NavSidebar';
import TopBar from './components/TopBar';
import CommandPalette from './components/CommandPalette';
import Dashboard from './pages/Dashboard';
import GisLayers from './pages/InteractiveGisMiningLayers';
import TargetQueue from './pages/subsurfaceTargetQueue';
import Calculator from './pages/Ore Grade & TonnageCalculator';
import CoordinateRegistry from './pages/GlobalCoordinateRegistry';
import { api } from './api';
import ContractSign from './pages/ContractSign';
import Profile from './pages/Profile';
import {
  BulkBillings, SaasBillings, ApiHub, BoundaryGuard
} from './pages/Segments';
import {
  CadastreRegistry, CustomsExportPortal, BorderRoyaltiesLedger, OfftakeEscrowHub,
  DroneDispatch as DroneDispatchWorkspace, LogisticsPipeline, CooperativePayoutLedger,
  CompanySettings, SovereignCompliance, SubscriptionBilling
} from './pages/PortalWorkspaces';

const DataFusionReadiness = lazy(() => import('./pages/RiskWorkspaces').then((module) => ({ default: module.DataFusionReadiness })));
const LinearAssetRiskDashboard = lazy(() => import('./pages/RiskWorkspaces').then((module) => ({ default: module.LinearAssetRiskDashboard })));
const InSARTelemetry = lazy(() => import('./pages/RiskWorkspaces').then((module) => ({ default: module.InSARTelemetry })));
const PipelineEmergencyAlerts = lazy(() => import('./pages/RiskWorkspaces').then((module) => ({ default: module.PipelineEmergencyAlerts })));
const StructuralMeshPreview = lazy(() => import('./pages/3DStructuralMeshPreview'));
const ExplorationReports = lazy(() => import('./pages/ExplorationReports'));
const ExplorationDashboard = lazy(() => import('./pages/Explorationdashboard'));
const TailingsDamDashboard = lazy(() => import('./pages/TailingsDamDashboard'));
const UtilityGridDashboard = lazy(() => import('./pages/UtilityGridDashboard'));

function initialView() {
  return NAV_ITEMS.find((item) => item.path === window.location.pathname)?.id || 'dashboard';
}

export default function App() {
  const { user, loading } = useAuth();
  const [view, setView] = useState(initialView);
  const [target, setTarget] = useState(null);
  const [focus, setFocus] = useState(null);
  const [layers, setLayers] = useState({ ndmi: true, alteration: false, aeromagnetic: false });
  const [countries, setCountries] = useState([]);
  const [minerals, setMinerals] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  const [catalogRetry, setCatalogRetry] = useState(0);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('mtrl-nav-collapsed') === '1');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      localStorage.setItem('mtrl-nav-collapsed', value ? '0' : '1');
      return !value;
    });
  };

  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    Promise.all([api('/api/v1/gaas/countries'), api('/api/v1/gaas/minerals')])
      .then(([countryData, mineralData]) => {
        if (!active) return;
        setCountries(countryData);
        setMinerals(mineralData);
        setCatalogError('');
      })
      .catch((error) => {
        if (active) setCatalogError(error.message || 'Could not load the exploration registry.');
      });
    return () => { active = false; };
  }, [user, catalogRetry]);

  const navigateTo = (id, replace = false) => {
    const item = NAV_ITEMS.find((candidate) => candidate.id === id);
    if (!item) return;
    if (window.location.pathname !== item.path) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', item.path);
    }
    setView(id);
  };

  useEffect(() => {
    const onPopState = () => setView(initialView());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!user) return;
    const item = NAV_ITEMS.find((candidate) => candidate.id === view);
    if (!item || (item.roles && !item.roles.includes(user.role))) {
      navigateTo(defaultView(user.role), true);
    }
  }, [user, view]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-slate-500">Establishing secure link…</div>;
  }
  if (!user) return <Login />;

  const allowed = segmentsFor(user.role).flatMap((s) => s.items.map((i) => i.id));
  const current = allowed.includes(view) ? view : defaultView(user.role);

  const pages = {
    dashboard: <Dashboard target={target} setTarget={setTarget} layers={layers} focus={focus} countries={countries} minerals={minerals} catalogError={catalogError} onRetryCatalog={() => setCatalogRetry((count) => count + 1)} />,
    gis: <GisLayers target={target} layers={layers} setLayers={setLayers} focus={focus} />,
    targets: <TargetQueue />,
    calculator: <Calculator />,
    fusion: <DataFusionReadiness />,
    'mesh-preview': <StructuralMeshPreview />,
    'exploration-reports': <ExplorationReports countries={countries} minerals={minerals} />,
    reports: <ExplorationReports countries={countries} minerals={minerals} defaultReportType="geotechnical" />,
    'dash-exploration': <ExplorationDashboard onSwitch={navigateTo} />,
    'dash-tailings': <TailingsDamDashboard onSwitch={navigateTo} />,
    'dash-utility': <UtilityGridDashboard onSwitch={navigateTo} />,
    registry: <CoordinateRegistry countries={countries} minerals={minerals} catalogError={catalogError} onRetryCatalog={() => setCatalogRetry((count) => count + 1)} />,
    contracts: <OfftakeEscrowHub />,
    drone: <DroneDispatchWorkspace />,
    pipeline: <LogisticsPipeline />,
    'cadastre-registry': <CadastreRegistry />,
    'cadastre-customs': <CustomsExportPortal />,
    royalties: <BorderRoyaltiesLedger />,
    'coop-ledger': <CooperativePayoutLedger />,
    organization: <CompanySettings />,
    compliance: <SovereignCompliance />,
    subscription: <SubscriptionBilling />,
    'linear-assets': <LinearAssetRiskDashboard />,
    'insar-telemetry': <InSARTelemetry />,
    'utility-alerts': <PipelineEmergencyAlerts />,
    bulk: <BulkBillings />,
    saas: <SaasBillings />,
    profile: <Profile />,
    apihub: <ApiHub />,
    boundary: <BoundaryGuard />
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      <NavSidebar
        currentView={current}
        setView={navigateTo}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.07),transparent_55%)]">
        <TopBar view={current} onOpenMenu={() => setMobileOpen(true)} onOpenPalette={() => setPaletteOpen(true)} onNavigate={navigateTo} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
            <Suspense fallback={<p className="text-sm text-slate-500">Loading workspace…</p>}>
              {pages[current]}
            </Suspense>
          </div>
        </main>
      </div>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={navigateTo}
        onLocate={(loc) => { setFocus(loc); navigateTo('gis'); }}
        countries={countries}
      />
    </div>
  );
}
