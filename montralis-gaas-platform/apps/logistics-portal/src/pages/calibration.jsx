import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Calibration({ minerals }) {
  const [sources, setSources] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    api('/api/v1/gaas/fusion-sources').then(setSources).catch((err) => setError(err.message));
  }, []);

  return <div className="page-stack">
    <header className="page-heading"><div><p className="eyebrow">HARDWARE & AUDIT / CATALOG</p><h1>Sensor calibration</h1><p>Review the mineral band reference catalog used by the platform’s spectral workflows.</p></div><span className="calibration-code">Nd / Pt</span></header>
    <div className="calibration-warning"><strong>Reference catalog only.</strong> This screen does not calibrate a physical drone payload or sync hardware. Calibration still requires a traceable reference standard and operator procedure.</div>
    <section className="catalog-section"><div className="panel-heading"><div><p className="eyebrow">SPECTRAL CONFIGURATION</p><h2>Mineral band index</h2></div><span>{minerals.length} profiles</span></div>
      {minerals.length === 0 ? <p className="empty-state">Mineral catalog is unavailable.</p> : <div className="catalog-grid">{minerals.map((mineral) => <article className="catalog-card" key={mineral.symbol}><div className="catalog-top"><span className="element-symbol">{mineral.symbol}</span><span className="catalog-class">{mineral.classification}</span></div><h3>{mineral.name}</h3><p>{mineral.sentinel2_note || 'Sensor profile available in the platform catalog.'}</p><div className="band-list">{(mineral.primary_sensor_bands || []).map((band) => <span key={band}>{band}</span>)}</div><small>Mode: {mineral.sentinel2_mode || 'reference'}</small></article>)}</div>}
    </section>
    <section className="catalog-section"><div className="panel-heading"><div><p className="eyebrow">FEED READINESS</p><h2>Connected data sources</h2></div></div>
      {error && <p className="error-message">{error}</p>}
      <div className="source-list">{sources.map((source) => <div className="source-row" key={source.id}><span className={`source-dot ${source.connected ? 'connected' : ''}`} /><div><strong>{source.label}</strong><small>{source.status}</small></div><span className={`source-state ${source.connected ? 'ready' : ''}`}>{source.connected ? 'Available' : 'Not connected'}</span></div>)}</div>
    </section>
  </div>;
}
