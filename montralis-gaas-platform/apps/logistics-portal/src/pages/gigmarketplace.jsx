import React, { useMemo, useState } from 'react';
import MapRadar from '../components/mapradar';

function distanceKm(a, b) {
	const radians = (value) => value * Math.PI / 180;
	const dLat = radians(b[0] - a[0]);
	const dLng = radians(b[1] - a[1]);
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a[0])) * Math.cos(radians(b[0])) * Math.sin(dLng / 2) ** 2;
	return 6371.0088 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export default function GigMarketplace({ discoveries, loading, onAccept, canAccept, savingId }) {
	const [country, setCountry] = useState('');
	const [center, setCenter] = useState({ latitude: '', longitude: '' });
	const [radius, setRadius] = useState('250');
	const [selected, setSelected] = useState(null);

	const filtered = useMemo(() => discoveries.filter((mission) => {
		const countryMatch = !country || mission.country?.toLowerCase().includes(country.trim().toLowerCase());
		const hasCenter = center.latitude !== '' && center.longitude !== '';
		const proximityMatch = !hasCenter || distanceKm([Number(center.latitude), Number(center.longitude)], [mission.latitude, mission.longitude]) <= Number(radius || 0);
		return countryMatch && proximityMatch;
	}), [discoveries, country, center, radius]);

	return <div className="page-stack">
		<header className="page-heading"><div><p className="eyebrow">MISSION CONTROL / OPPORTUNITIES</p><h1>Open gig marketplace</h1><p>Exploration discoveries available for field validation. Coordinates and confidence are engine outputs, not confirmed deposits.</p></div><span className="heading-count">{filtered.length} <small>MISSIONS</small></span></header>
		<section className="filter-bar">
			<label>Country<input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Type a country name" /></label>
			<label>Near latitude<input type="number" step="any" min="-90" max="90" value={center.latitude} onChange={(event) => setCenter({ ...center, latitude: event.target.value })} placeholder="Optional" /></label>
			<label>Near longitude<input type="number" step="any" min="-180" max="180" value={center.longitude} onChange={(event) => setCenter({ ...center, longitude: event.target.value })} placeholder="Optional" /></label>
			<label>Radius<select value={radius} onChange={(event) => setRadius(event.target.value)}><option value="50">50 km</option><option value="100">100 km</option><option value="250">250 km</option><option value="500">500 km</option><option value="1000">1,000 km</option></select></label>
			{(country || center.latitude || center.longitude) && <button className="text-button" onClick={() => { setCountry(''); setCenter({ latitude: '', longitude: '' }); }}>Clear filters</button>}
		</section>
		<div className="market-grid">
			<section className="mission-list" aria-label="Available missions">
				{loading && <p className="empty-state">Loading saved exploration discoveries…</p>}
				{!loading && filtered.length === 0 && <p className="empty-state">No saved discoveries match those filters.</p>}
				{filtered.map((mission) => <article key={mission.id} className={`mission-card ${selected?.id === mission.id ? 'selected' : ''}`} onClick={() => setSelected(mission)}>
					<div className="mission-card-top"><span className="mineral-chip">{mission.mineral_target}</span><span className="mission-country">{mission.country}</span></div>
					<h2>{mission.mineral_target} target</h2>
					<p className="mission-coordinates">{Number(mission.latitude).toFixed(4)}° / {Number(mission.longitude).toFixed(4)}°</p>
					<div className="mission-metrics"><span><small>Spectral confidence</small><strong>{Number(mission.spectral_confidence).toFixed(1)}%</strong></span><span><small>Indicative tonnage</small><strong>{Number(mission.estimated_tonnage).toLocaleString()} t</strong></span></div>
					<div className="mission-card-actions"><button type="button" className="text-button" onClick={(event) => { event.stopPropagation(); setSelected(mission); }}>View location</button>
						<button type="button" className="action-button small" disabled={!canAccept || savingId === mission.id} onClick={(event) => { event.stopPropagation(); onAccept(mission); }}>{savingId === mission.id ? 'Requesting…' : canAccept ? 'Request field task' : 'Cooperative role required'}</button></div>
				</article>)}
			</section>
			<section className="map-panel"><div className="panel-heading"><div><p className="eyebrow">TARGET OVERVIEW</p><h2>Mission coordinates</h2></div><span>{filtered.length} plotted</span></div><MapRadar missions={filtered.map((item) => ({ ...item, title: item.mineral_target }))} selected={selected} onSelect={setSelected} height="100%" /></section>
		</div>
		<p className="disclaimer">No mission payment is shown because the platform does not have a priced gig marketplace. Requesting a task creates a field-validation work ticket.</p>
	</div>;
}
