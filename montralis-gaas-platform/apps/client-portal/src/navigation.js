export const ROLE_GROUPS = {
  commercial: ['MINING_COOPERATIVE', 'ENTERPRISE_TRADER'],
  sovereign: ['GOVERNMENT_MINISTER', 'CUSTOMS_DIRECTOR', 'RESOURCE_AUDITOR', 'PUBLIC_HEALTH_AUDITOR']
};

export const NAV_SECTIONS = [
  {
    id: 'exploration',
    label: 'Exploration & Spectrometry',
    items: [
      { id: 'dashboard', path: '/dashboard', label: 'Universal Scan Dashboard' },
      { id: 'gis', path: '/gis', label: 'Interactive GIS Mapping', roles: ROLE_GROUPS.commercial },
      { id: 'targets', path: '/targets', label: 'Subsurface Target Queue', roles: ROLE_GROUPS.commercial },
      { id: 'calculator', path: '/calculator', label: 'Ore Grade & Tonnage Calculator', roles: ROLE_GROUPS.commercial },
      { id: 'fusion', path: '/explorer/data-fusion', label: 'Multi-Dimensional Data Fusion', roles: ROLE_GROUPS.commercial },
      { id: 'mesh-preview', path: '/explorer/3d-structure', label: '3D Structural Preview', roles: ROLE_GROUPS.commercial },
      { id: 'exploration-reports', path: '/analytics/exploration-reports', label: 'Exploration & Risk Reports', roles: ROLE_GROUPS.commercial },
      { id: 'dash-exploration', path: '/dashboards/exploration', label: 'Mineral Exploration AI', roles: ROLE_GROUPS.commercial },
      { id: 'registry', path: '/registry', label: 'Global Coordinate Registry' }
    ]
  },
  {
    id: 'tailings-environment',
    label: 'Tailings Dam, Environmental Risk & Compliance',
    items: [
      { id: 'dash-tailings', path: '/dashboards/tailings-dam', label: 'Tailings Dam Movement Monitor', roles: ROLE_GROUPS.commercial },
      { id: 'reports', path: '/analytics/reports', label: 'Environmental & Geotechnical Reports' },
      { id: 'compliance', path: '/settings/compliance', label: 'Environmental & Sovereign Compliance' }
    ]
  },
  {
    id: 'sovereign',
    label: 'Sovereign Cadastre & Customs',
    items: [
      { id: 'cadastre-registry', path: '/cadastre/registry', label: 'Sovereign Cadastre Registry', roles: ROLE_GROUPS.sovereign },
      { id: 'cadastre-customs', path: '/cadastre/customs', label: 'Customs Export Portal', roles: ROLE_GROUPS.sovereign },
      { id: 'royalties', path: '/billing/royalties', label: 'Border Royalties Ledger', roles: ROLE_GROUPS.sovereign }
    ]
  },
  {
    id: 'energy-geohazard',
    label: 'Utility & Geohazard Monitoring',
    items: [
      { id: 'dash-utility', path: '/dashboards/utility-grid', label: 'Energy Infrastructure Hazard Monitor', roles: ROLE_GROUPS.commercial },
      { id: 'linear-assets', path: '/utility/linear-assets', label: 'Infrastructure Asset Registry' },
      { id: 'insar-telemetry', path: '/utility/insar-telemetry', label: 'Ground Movement Telemetry' },
      { id: 'utility-alerts', path: '/utility/alerts', label: 'Asset Thresholds & Advisory Alerts' }
    ]
  },
  {
    id: 'offtake',
    label: 'Offtake & Logistics',
    items: [
      { id: 'contracts', path: '/contracts/offtake', label: 'Digital Offtake Escrow Hub', roles: ROLE_GROUPS.commercial },
      { id: 'drone', path: '/logistics/drone-dispatch', label: 'Drone & Field Validation', roles: ROLE_GROUPS.commercial },
      { id: 'pipeline', path: '/logistics/pipeline', label: 'Refined Logistical Pipeline', roles: [...ROLE_GROUPS.commercial, 'CUSTOMS_DIRECTOR'] },
      { id: 'coop-ledger', path: '/billing/coop-ledger', label: 'Cooperative Payout Ledger', roles: ROLE_GROUPS.commercial }
    ]
  },
  {
    id: 'billing',
    label: 'Commercial Billing',
    items: [
      { id: 'bulk', path: '/billing/bulk', label: 'Bulk Commodity Billings', roles: ['ENTERPRISE_TRADER'] },
      { id: 'saas', path: '/billing/saas', label: 'B2B Platform SaaS Billings', roles: ['ENTERPRISE_TRADER'] },
      { id: 'subscription', path: '/billing/subscription', label: 'Subscription Billing' }
    ]
  },
  {
    id: 'universal',
    label: 'Universal Core System',
    items: [
      { id: 'organization', path: '/settings/organization', label: 'Company Settings' },
      { id: 'apihub', path: '/settings/api', label: 'API Developer Integration Hub' },
      { id: 'boundary', path: '/settings/boundary', label: 'Sovereign Data Boundary Guard' },
      { id: 'profile', path: '/profile', label: 'User Profile' }
    ]
  }
];

export const NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

export function sectionsFor(role) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.roles || item.roles.includes(role))
  })).filter((section) => section.items.length > 0);
}

export const segmentsFor = sectionsFor;

export function itemForPath(path) {
  return NAV_ITEMS.find((item) => item.path === path) || null;
}

export function defaultView(role) {
  if (ROLE_GROUPS.sovereign.includes(role)) return 'cadastre-registry';
  return NAV_ITEMS.find((item) => !item.roles || item.roles.includes(role))?.id || 'profile';
}
