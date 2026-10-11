import React from 'react';

const PATHS = {
  home: 'M3 11l9-8 9 8M5 9.5V21h14V9.5M10 21v-6h4v6',
  gem: 'M6 3h12l4 6-10 12L2 9l4-6zM2 9h20M9 3l3 6 3-6M12 9v12',
  map: 'M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2zM9 3v16M15 5v16',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 12h.01',
  calc: 'M5 3h14v18H5zM8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5',
  cube: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM4 7.5l8 4.5 8-4.5M12 12v9',
  file: 'M14 3H6v18h12V7l-4-4zM14 3v4h4M9 13h6M9 17h6',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  truck: 'M3 6h11v10H3zM14 9h4l3 3v4h-7M7 18.5h.01M17 18.5h.01',
  coins: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  landmark: 'M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M3 10l9-6 9 6',
  card: 'M3 6h18v12H3zM3 10h18M7 15h3',
  activity: 'M3 12h4l3-8 4 16 3-8h4',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  key: 'M15 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM11 14l-8 8M6 19l2 2',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6',
  bell: 'M6 16v-5a6 6 0 1 1 12 0v5l2 2H4l2-2zM10 21h4',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5',
  menu: 'M4 6h16M4 12h16M4 18h16',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  down: 'M6 9l6 6 6-6',
  logout: 'M9 21H5V3h4M16 17l5-5-5-5M21 12H9',
  close: 'M6 6l12 12M18 6L6 18',
  dam: 'M3 20l6-12 4 7 3-4 5 9z',
  zap: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z'
};

export function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.75 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name] || PATHS.file} />
    </svg>
  );
}

export const NAV_ICONS = {
  dashboard: 'home', gis: 'map', targets: 'target', calculator: 'calc', fusion: 'layers', 'mesh-preview': 'cube',
  reports: 'file', registry: 'globe', 'dash-exploration': 'gem', 'dash-tailings': 'dam', 'dash-utility': 'zap',
  contracts: 'file', drone: 'send', pipeline: 'truck', 'coop-ledger': 'coins',
  'cadastre-registry': 'landmark', 'cadastre-customs': 'truck', royalties: 'coins',
  bulk: 'coins', saas: 'card', subscription: 'card',
  'linear-assets': 'map', 'insar-telemetry': 'activity', 'utility-alerts': 'bell',
  organization: 'settings', compliance: 'shield', apihub: 'key', boundary: 'shield', profile: 'user'
};
