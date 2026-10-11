import React from 'react';

const LAYER_STYLES = {
  ndmi: 'bg-[radial-gradient(circle_at_30%_40%,rgba(16,185,129,0.35),transparent_45%)]',
  alteration: 'bg-[radial-gradient(circle_at_70%_60%,rgba(234,88,12,0.35),transparent_40%)]',
  aeromagnetic: 'bg-[radial-gradient(circle_at_50%_20%,rgba(99,102,241,0.35),transparent_45%)]'
};

export default function MapViewer({ activeTarget, layers = {}, focus }) {
  return (
    <div className="bg-slate-950 rounded-lg border border-slate-800 h-96 w-full relative flex items-center justify-center overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
      {Object.keys(LAYER_STYLES).map(
        (k) => layers[k] && <div key={k} className={`absolute inset-0 ${LAYER_STYLES[k]}`} />
      )}

      {focus && (
        <p className="absolute top-3 left-3 text-xs font-mono text-emerald-300 bg-slate-900/90 px-2 py-1 rounded border border-slate-800">
          VIEW CENTER: {focus.lat}, {focus.lng} ({focus.label})
        </p>
      )}

      {activeTarget ? (
        <div className="text-center p-6 z-10 bg-slate-900/90 rounded border border-emerald-500/30 max-w-md shadow-2xl">
          <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping mx-auto mb-4"></div>
          <h3 className="text-lg font-bold text-emerald-400 mb-1">{activeTarget.mineral_target} Signature Detected</h3>
          <p className="text-xs text-slate-400 font-mono mb-4">
            LOC: {activeTarget.latitude}°N , {activeTarget.longitude}°E
          </p>
          <div className="grid grid-cols-2 gap-2 text-left text-xs bg-slate-950 p-3 rounded">
            <div><span className="text-slate-500">Confidence:</span> {activeTarget.spectral_confidence}%</div>
            <div><span className="text-slate-500">Est. Tonnage:</span> {activeTarget.estimated_tonnage}t</div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 tracking-wide z-10">
          Initiate satellite matrix scan to plot georeferenced coordinates
        </p>
      )}
    </div>
  );
}
