import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth/AuthContext';
import { NAV_SECTIONS } from '../navigation';
import { NotificationsButton } from '../pages/PortalWorkspaces';
import { Icon } from './icons';

function Breadcrumb({ view }) {
  const section = NAV_SECTIONS.find((candidate) => candidate.items.some((item) => item.id === view));
  const item = section?.items.find((candidate) => candidate.id === view);
  if (!item) return null;
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-2 text-sm md:flex">
      <span className="truncate text-slate-500">{section.label}</span>
      <Icon name="right" className="h-3.5 w-3.5 shrink-0 text-slate-700" />
      <span className="truncate font-medium text-slate-100">{item.label}</span>
    </nav>
  );
}

function FeedStatus() {
  const [live, setLive] = useState(false);
  useEffect(() => {
    const check = () => api('/api/v1/gaas/health').then(() => setLive(true)).catch(() => setLive(false));
    check();
    const timer = setInterval(check, 30000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className={`hidden items-center gap-2 rounded-full border px-3 py-1 text-xs sm:inline-flex ${live ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' : 'border-rose-500/20 bg-rose-500/5 text-rose-300'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-emerald-400' : 'bg-rose-400'}`} />
      Satellite feed {live ? 'live' : 'offline'}
    </span>
  );
}

function UserMenu({ onNavigate }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (!ref.current?.contains(event.target)) setOpen(false); };
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3 hover:bg-white/10">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-slate-950">{user.name.slice(0, 1).toUpperCase()}</span>
        <span className="hidden max-w-[140px] truncate text-sm text-slate-200 sm:block">{user.name}</span>
        <Icon name="down" className="h-4 w-4 text-slate-500" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl">
          <div className="border-b border-white/5 px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-slate-400">{user.title}</p>
            <p className="mt-1 truncate text-[11px] text-slate-600">{user.email}</p>
          </div>
          {[['profile', 'User Profile', 'user'], ['apihub', 'API Developer Hub', 'key'], ['boundary', 'Data Boundary Guard', 'shield']].map(([id, label, icon]) => (
            <button key={id} role="menuitem" type="button" onClick={() => { setOpen(false); onNavigate(id); }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5">
              <Icon name={icon} className="h-4 w-4" />{label}
            </button>
          ))}
          <button role="menuitem" type="button" onClick={logout} className="flex w-full items-center gap-3 border-t border-white/5 px-4 py-2.5 text-sm text-rose-300 hover:bg-rose-500/10">
            <Icon name="logout" className="h-4 w-4" />Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function TopBar({ view, onOpenMenu, onOpenPalette, onNavigate }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-white/5 bg-slate-950/80 px-4 backdrop-blur-md sm:px-6">
      <button type="button" onClick={onOpenMenu} aria-label="Open menu" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden">
        <Icon name="menu" />
      </button>
      <Breadcrumb view={view} />
      <div className="flex-1" />
      <button type="button" onClick={onOpenPalette} aria-label="Search pages and locations"
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 hover:bg-white/10 sm:w-64">
        <Icon name="search" className="h-4 w-4" />
        <span className="hidden flex-1 text-left sm:inline">Search…</span>
        <kbd className="hidden rounded border border-white/10 px-1.5 text-[10px] text-slate-500 sm:inline">Ctrl K</kbd>
      </button>
      <FeedStatus />
      <NotificationsButton />
      <UserMenu onNavigate={onNavigate} />
    </header>
  );
}
