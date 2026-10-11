import React, { useState } from 'react';

export default function CoordinateRegistry({ countries, minerals, catalogError, onRetryCatalog }) {
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState('countries');
  const rows = countries.filter((c) => c.name.toLowerCase().includes(filter.trim().toLowerCase()));
  const mineralNames = Object.fromEntries(minerals.map((mineral) => [mineral.name.toUpperCase(), mineral.name]));

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold">Global Coordinate Registry</h2>
        <p className="text-sm text-slate-400">
          Reference points, mapped mineral occurrences and WGS84 bounds for {countries.length} countries.
          USGS MRDS occurrences are historical (systematic updates ended in 2011); national references are not mine locations. Verify before field use.
        </p>
      </div>
      <div role="tablist" aria-label="Coordinate registry views" className="flex border-b border-slate-800">
        <button
          role="tab"
          aria-selected={activeTab === 'countries'}
          onClick={() => setActiveTab('countries')}
          className={`px-4 py-2 text-sm border-b-2 ${activeTab === 'countries' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400'}`}
        >
          Countries ({countries.length})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'minerals'}
          onClick={() => setActiveTab('minerals')}
          className={`px-4 py-2 text-sm border-b-2 ${activeTab === 'minerals' ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400'}`}
        >
          Mineral spectra ({minerals.length})
        </button>
      </div>
      {catalogError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 text-sm text-rose-400">
          <span>Registry data could not be loaded: {catalogError}</span>
          <button onClick={onRetryCatalog} className="underline">Retry registry</button>
        </div>
      )}
      {activeTab === 'countries' && <>
      {countries.length === 0 && <p className="text-sm text-slate-400">Loading country registry…</p>}
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter by country"
        aria-label="Filter countries"
        className="w-72 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-emerald-500 outline-none"
      />
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Country</th>
              <th className="text-left px-4 py-2">Reference lat, lng</th>
              <th className="text-left px-4 py-2">Mapped areas and minerals</th>
              <th className="text-left px-4 py-2">Bounds (W, S, E, N)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.name} className="border-t border-slate-800 font-mono text-xs">
                <td className="px-4 py-2 font-sans text-sm">{c.name}</td>
                <td className="px-4 py-2">{c.lat}, {c.lng}</td>
                <td className="px-4 py-2 font-sans">
                  {c.areas.map((area) => {
                    const areaMinerals = area.commodity_labels?.length
                      ? area.commodity_labels
                      : area.minerals.map((code) => mineralNames[code] || code);
                    return (
                      <div key={area.source_id || area.name} className="mb-1">
                        {area.name} ({area.lat}, {area.lng}){' '}
                        <span className={area.reference_only ? 'text-amber-400' : 'text-slate-500'}>
                          {areaMinerals.length ? areaMinerals.join(', ') : 'No mapped mineral occurrences'}
                        </span>
                        {area.mapping_basis && <span className="block text-[11px] text-slate-600">{area.mapping_basis}</span>}
                      </div>
                    );
                  })}
                </td>
                <td className="px-4 py-2">
                  {c.bbox.join(', ')}
                  {c.bbox_source === 'approximate' && <span className="ml-2 text-amber-400">approx.</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>}
      {activeTab === 'minerals' && <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold">Mineral Spectral Registry</h3>
          <p className="text-sm text-slate-400">Target elements, reference bands and known limitations for the selected sensors.</p>
        </div>
        {minerals.length === 0 ? (
          <p className="text-sm text-slate-400">Loading mineral profiles…</p>
        ) : (
          <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-lg">
            <table className="w-full min-w-[1350px] text-sm">
              <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2">Classification</th>
                  <th className="text-left px-4 py-2">Element</th>
                  <th className="text-left px-4 py-2">Symbol</th>
                  <th className="text-left px-4 py-2">Primary sensor bands</th>
                  <th className="text-left px-4 py-2">Wavelength profile</th>
                  <th className="text-left px-4 py-2">Signature behaviour</th>
                  <th className="text-left px-4 py-2">Mapped areas and coordinates</th>
                  <th className="text-left px-4 py-2">Sentinel-2</th>
                </tr>
              </thead>
              <tbody>
                {minerals.map((m) => (
                  <tr key={m.symbol} className="border-t border-slate-800 align-top">
                    <td className="px-4 py-2 text-slate-400">{m.classification}</td>
                    <td className="px-4 py-2">{m.name}</td>
                    <td className="px-4 py-2 font-mono">{m.symbol}</td>
                    <td className="px-4 py-2">{m.primary_sensor_bands}</td>
                    <td className="px-4 py-2">{m.wavelength_profile}</td>
                    <td className="px-4 py-2">{m.signature_behavior}</td>
                    <td className="px-4 py-2">
                      {m.mapped_areas?.length ? m.mapped_areas.map((area) => (
                        <div key={`${area.country}-${area.area}`} className="mb-1">
                          {area.area}, {area.country} ({area.lat}, {area.lng})
                          <span className="block text-xs text-slate-500">{area.mapping_basis}</span>
                        </div>
                      )) : <span className="text-amber-400">No mapped area</span>}
                    </td>
                    <td className={`px-4 py-2 ${m.sentinel2_mode === 'unsupported' ? 'text-amber-400' : 'text-sky-300'}`}>
                      {m.sentinel2_mode === 'unsupported' ? 'Not supported' : 'Proxy only'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>}
    </div>
  );
}
