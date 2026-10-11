import React, { useEffect, useMemo, useRef, useState } from 'react';

const SECTION_MARKS = { finance: '$', provisioning: 'ID', spatial: 'SD', geotechnical: 'GR', industrial: 'IN', system: 'SYS' };

export default function Sidebar({ sections, currentView, setView, collapsed, mobileOpen, onToggleCollapse, onCloseMobile }) {
  const [query, setQuery] = useState('');
  const [openSections, setOpenSections] = useState(() => Object.fromEntries(sections.map((section) => [section.id, true])));
  const search = useRef(null);
  const compact = collapsed && !mobileOpen;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sections.map((section) => ({
      ...section,
      items: section.items.filter((item) => !needle || `${item.label} ${section.label}`.toLowerCase().includes(needle))
    })).filter((section) => section.items.length);
  }, [sections, query]);
  const select = (id) => { setView(id); onCloseMobile(); };

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        search.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {mobileOpen && <button type="button" aria-label="Close navigation" onClick={onCloseMobile} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.07] bg-[#111416] transition-all duration-200 lg:static lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${compact ? 'w-[76px]' : 'w-[286px]'}`}>
        <div className={`flex h-[74px] shrink-0 items-center border-b border-white/[0.07] px-4 ${compact ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 to-orange-500 text-lg font-black text-[#171313] shadow-lg shadow-rose-950/40">M</span>
            {!compact && <div className="leading-tight"><p className="text-sm font-bold tracking-[0.16em] text-white">MONTRALIS</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-rose-300">Admin Control Plane</p></div>}
          </div>
          {mobileOpen && <button type="button" onClick={onCloseMobile} aria-label="Close menu" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden">×</button>}
        </div>

        {!compact && <div className="px-3 pt-4">
          <label className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 focus-within:border-rose-400/40">
            <svg className="h-4 w-4 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>
            <input ref={search} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter admin tools" className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600" />
            <kbd className="rounded border border-white/10 px-1 text-[9px] text-slate-600">/</kbd>
          </label>
        </div>}

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {filtered.map((section) => <section key={section.id}>
            {compact ? <div className="mb-2 mt-2 h-px bg-white/[0.07]" /> : (
              <button type="button" onClick={() => setOpenSections((value) => ({ ...value, [section.id]: !value[section.id] }))} className="flex w-full items-center gap-2 px-2 pb-2 text-left">
                <span className="flex h-5 min-w-5 items-center justify-center rounded bg-white/[0.05] px-1 text-[9px] font-bold text-slate-500">{SECTION_MARKS[section.id]}</span>
                <span className="flex-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{section.label}</span>
                <span className="text-xs text-slate-600">{openSections[section.id] ? '−' : '+'}</span>
              </button>
            )}
            {(compact || openSections[section.id] || query) && <div className="space-y-0.5">
              {section.items.map((item) => <button key={item.id} type="button" onClick={() => select(item.id)} title={compact ? item.label : undefined} aria-current={currentView === item.id ? 'page' : undefined}
                className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition ${currentView === item.id ? 'bg-rose-400/10 font-semibold text-rose-200' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'} ${compact ? 'justify-center' : ''}`}>
                {currentView === item.id && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-rose-400" />}
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${currentView === item.id ? 'bg-rose-400' : 'bg-slate-700'}`} />
                {!compact && <span className="leading-snug">{item.label}</span>}
              </button>)}
            </div>}
          </section>)}
          {filtered.length === 0 && <p className="px-3 py-6 text-center text-xs text-slate-500">No matching admin tools.</p>}
        </nav>

        <div className="hidden border-t border-white/[0.07] p-3 lg:block">
          <button type="button" onClick={onToggleCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-white/[0.04] hover:text-slate-200 ${collapsed ? 'justify-center' : ''}`}>
            <span className="text-lg leading-none">{collapsed ? '›' : '‹'}</span>{!collapsed && 'Collapse navigation'}
          </button>
        </div>
      </aside>
    </>
  );
}
