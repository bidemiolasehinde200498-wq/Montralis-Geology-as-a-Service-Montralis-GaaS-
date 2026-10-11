import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { sectionsFor } from '../navigation';
import { parseLocation } from '../geo';
import { Icon, NAV_ICONS } from './icons';

export default function CommandPalette({ open, onClose, onNavigate, onLocate, countries }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const input = useRef(null);

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    const entries = sectionsFor(user.role).flatMap((section) =>
      section.items.map((item) => ({ kind: 'page', id: item.id, label: item.label, hint: section.label }))
    );
    const matches = entries.filter((entry) => !text || `${entry.label} ${entry.hint}`.toLowerCase().includes(text)).slice(0, 8);
    const location = text ? parseLocation(query.trim(), countries) : null;
    return location ? [{ kind: 'location', label: `Show on map: ${query.trim()}`, hint: 'Coordinate search', location }, ...matches] : matches;
  }, [query, user.role, countries]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setIndex(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);
  useEffect(() => setIndex(0), [query]);

  if (!open) return null;

  const choose = (entry) => {
    if (!entry) return;
    if (entry.kind === 'location') onLocate(entry.location);
    else onNavigate(entry.id);
    onClose();
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') onClose();
    else if (event.key === 'ArrowDown') { event.preventDefault(); setIndex((value) => Math.min(value + 1, results.length - 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setIndex((value) => Math.max(value - 1, 0)); }
    else if (event.key === 'Enter') { event.preventDefault(); choose(results[index]); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-950/70 p-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/5 px-4">
          <Icon name="search" className="h-5 w-5 text-slate-500" />
          <input ref={input} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} maxLength={100}
            placeholder="Jump to a page, or enter “-19.015, 29.154” / a country…" aria-label="Search pages and locations"
            className="h-14 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">Esc</kbd>
        </div>
        <ul role="listbox" className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">No matching pages or locations.</li>}
          {results.map((entry, i) => (
            <li key={`${entry.kind}-${entry.id || entry.label}`} role="option" aria-selected={i === index}>
              <button type="button" onMouseEnter={() => setIndex(i)} onClick={() => choose(entry)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${i === index ? 'bg-emerald-500/10 text-emerald-200' : 'text-slate-300'}`}>
                <Icon name={entry.kind === 'location' ? 'map' : NAV_ICONS[entry.id]} className="h-[18px] w-[18px] shrink-0" />
                <span className="flex-1 truncate">{entry.label}</span>
                <span className="text-xs text-slate-500">{entry.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
