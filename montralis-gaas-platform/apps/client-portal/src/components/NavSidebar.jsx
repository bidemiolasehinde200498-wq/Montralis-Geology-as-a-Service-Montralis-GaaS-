import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { sectionsFor } from '../navigation';
import { Icon, NAV_ICONS } from './icons';

function Brand({ compact }) {
  return (
    <div className="flex items-center gap-3 overflow-hidden">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 font-black text-slate-950 shadow-lg shadow-emerald-900/40">M</div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-[0.18em] text-white">MONTRALIS</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Geology-as-a-Service</p>
        </div>
      )}
    </div>
  );
}

function NavItem({ item, active, collapsed, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      title={collapsed ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-emerald-400" />}
      <Icon name={NAV_ICONS[item.id]} className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="truncate text-left">{item.label}</span>}
    </button>
  );
}

export default function NavSidebar({ currentView, setView, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  const { user } = useAuth();
  const sections = sectionsFor(user.role);
  const select = (id) => { setView(id); onCloseMobile(); };
  const compact = collapsed && !mobileOpen;

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden" onClick={onCloseMobile} aria-hidden="true" />}
      <aside
        aria-label="Primary"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/5 bg-slate-950 transition-all duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${compact ? 'w-[76px]' : 'w-72'}`}
      >
        <div className={`flex h-16 shrink-0 items-center border-b border-white/5 px-4 ${compact ? 'justify-center' : 'justify-between'}`}>
          <Brand compact={compact} />
          {mobileOpen && (
            <button type="button" onClick={onCloseMobile} aria-label="Close menu" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden">
              <Icon name="close" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.id} className="space-y-1">
              {compact
                ? <div className="mx-3 mb-2 h-px bg-white/5" />
                : <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">{section.label}</p>}
              {section.items.map((item) => (
                <NavItem key={item.id} item={item} active={currentView === item.id} collapsed={compact} onSelect={select} />
              ))}
            </div>
          ))}
        </nav>

        <div className="hidden border-t border-white/5 p-3 lg:block">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-white/5 hover:text-slate-200 ${collapsed ? 'justify-center' : ''}`}
          >
            <Icon name={collapsed ? 'right' : 'left'} className="h-[18px] w-[18px]" />
            {!collapsed && 'Collapse'}
          </button>
        </div>
      </aside>
    </>
  );
}
