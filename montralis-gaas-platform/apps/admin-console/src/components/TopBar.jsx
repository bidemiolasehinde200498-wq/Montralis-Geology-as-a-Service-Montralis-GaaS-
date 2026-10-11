import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

function SearchIcon() {
  return <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg>;
}

function SectionName({ view, sections }) {
  const section = sections.find((group) => group.items.some((item) => item.id === view));
  const item = section?.items.find((entry) => entry.id === view);
  return <div className="hidden min-w-0 items-center gap-2 md:flex">
    <span className="truncate text-xs text-slate-500">{section?.label || 'Administration'}</span>
    <span className="text-slate-700">/</span>
    <span className="truncate text-sm font-semibold text-slate-100">{item?.label || 'Control Plane'}</span>
  </div>;
}

export default function TopBar({ view, sections, onNavigate, onOpenMenu }) {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const input = useRef(null);
  const userMenu = useRef(null);
  const pages = useMemo(() => sections.flatMap((section) => section.items.map((item) => ({ ...item, section: section.label }))), [sections]);
  const matches = pages.filter((page) => !query || `${page.label} ${page.section}`.toLowerCase().includes(query.toLowerCase())).slice(0, 7);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
      if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        event.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (paletteOpen) {
      setQuery('');
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [paletteOpen]);

  useEffect(() => {
    if (!userOpen) return undefined;
    const close = (event) => { if (!userMenu.current?.contains(event.target)) setUserOpen(false); };
    const onKey = (event) => { if (event.key === 'Escape') setUserOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', onKey); };
  }, [userOpen]);

  const choose = (id) => { onNavigate(id); setPaletteOpen(false); };

  return <>
    <header className="sticky top-0 z-30 flex h-[74px] shrink-0 items-center gap-3 border-b border-white/[0.07] bg-[#111416]/90 px-4 backdrop-blur-xl sm:px-6">
      <button type="button" onClick={onOpenMenu} aria-label="Open admin navigation" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <SectionName view={view} sections={sections} />
      <div className="flex-1" />
      <button type="button" onClick={() => setPaletteOpen(true)} aria-label="Find an admin page" className="flex w-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] p-2 text-slate-400 hover:bg-white/[0.07] sm:w-64 sm:justify-start sm:gap-2 sm:px-3">
        <SearchIcon />
        <span className="hidden flex-1 text-left text-xs text-slate-500 sm:block">Find a workspace</span>
        <kbd className="hidden rounded border border-white/10 px-1.5 py-0.5 text-[9px] text-slate-600 sm:block">Ctrl K</kbd>
      </button>
      <div ref={userMenu} className="relative">
        <button type="button" onClick={() => setUserOpen((value) => !value)} aria-expanded={userOpen} aria-haspopup="menu" className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] py-1.5 pl-1.5 pr-2.5 hover:bg-white/[0.07]">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-rose-400/15 text-xs font-bold text-rose-200">{user.name.slice(0, 1).toUpperCase()}</span>
          <span className="hidden max-w-[140px] text-left sm:block"><span className="block truncate text-xs font-semibold text-slate-200">{user.name}</span><span className="block truncate text-[10px] text-slate-500">{user.role.replaceAll('_', ' ')}</span></span>
          <svg viewBox="0 0 24 24" className="hidden h-3.5 w-3.5 text-slate-600 sm:block" fill="none" stroke="currentColor" strokeWidth="2"><path d="m7 10 5 5 5-5"/></svg>
        </button>
        {userOpen && <div role="menu" className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#191d20] shadow-2xl">
          <div className="border-b border-white/[0.07] px-4 py-3"><p className="truncate text-sm font-semibold">{user.name}</p><p className="mt-1 truncate text-xs text-slate-500">{user.email}</p></div>
          <button type="button" role="menuitem" onClick={logout} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-rose-300 hover:bg-rose-500/10">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 17l5-5-5-5M15 12H3M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></svg>
            Sign out
          </button>
        </div>}
      </div>
    </header>

    {paletteOpen && <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 p-4 pt-[13vh] backdrop-blur-sm" onMouseDown={() => setPaletteOpen(false)}>
      <div role="dialog" aria-modal="true" aria-label="Find admin workspace" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#191d20] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4"><span className="text-slate-500"><SearchIcon /></span><input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') setPaletteOpen(false); if (event.key === 'Enter' && matches[0]) choose(matches[0].id); }} placeholder="Search admin workspaces…" className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"/><kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">Esc</kbd></div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {matches.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">No workspaces found.</li>}
          {matches.map((page) => <li key={page.id}><button type="button" onClick={() => choose(page.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left hover:bg-rose-400/10 ${page.id === view ? 'text-rose-200' : 'text-slate-300'}`}><span className="h-1.5 w-1.5 rounded-full bg-rose-400"/><span className="flex-1 text-sm">{page.label}</span><span className="text-[10px] text-slate-600">{page.section}</span></button></li>)}
        </ul>
      </div>
    </div>}
  </>;
}
