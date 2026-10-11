import React from 'react';
import MapViewer from '../components/MapViewer';

const LAYERS = [
  ['ndmi', 'Spectral Indices (NDMI)'],
  ['alteration', 'Alteration Zones (Clay / Iron Oxides)'],
  ['aeromagnetic', 'Aeromagnetic Grid Anomalies']
];

export default function GisLayers({ target, layers, setLayers, focus }) {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold">Interactive GIS Layer Mapping</h2>
        <p className="text-sm text-slate-400">Toggle visual data layers on and off.</p>
      </div>
      <div className="flex flex-wrap gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800">
        {LAYERS.map(([key, label]) => (
          <label key={key} className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={!!layers[key]}
              onChange={(e) => setLayers({ ...layers, [key]: e.target.checked })}
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-amber-400">Layer overlays are illustrative until real raster tiles are connected.</p>
      <MapViewer activeTarget={target} layers={layers} focus={focus} />
    </div>
  );
}
