import React from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';

export default function MapRadar({ missions = [], selected, onSelect, height = '480px' }) {
	const points = missions.filter((mission) => Number.isFinite(Number(mission.latitude)) && Number.isFinite(Number(mission.longitude)));
	const selectedPoint = selected && [Number(selected.latitude), Number(selected.longitude)];
	const center = selectedPoint || (points[0] ? [Number(points[0].latitude), Number(points[0].longitude)] : [-13.5, 28.0]);
	return <div className="map-frame" style={{ height }}>
		<MapContainer center={center} zoom={selected ? 9 : 4} scrollWheelZoom className="mission-map">
			<TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
			{points.map((mission) => <CircleMarker key={mission.id} center={[Number(mission.latitude), Number(mission.longitude)]} radius={selected?.id === mission.id ? 9 : 6}
				pathOptions={{ color: selected?.id === mission.id ? '#ff765b' : '#42d6aa', fillColor: selected?.id === mission.id ? '#ff765b' : '#42d6aa', fillOpacity: 0.85 }}
				eventHandlers={{ click: () => onSelect?.(mission) }}>
				<Popup><strong>{mission.title || mission.target_name || mission.mineral_target}</strong><br />{mission.country || mission.status || 'Registered coordinate'}<br />{Number(mission.latitude).toFixed(4)}, {Number(mission.longitude).toFixed(4)}</Popup>
			</CircleMarker>)}
		</MapContainer>
		<div className="map-overlay-label"><span className="status-dot" /> COORDINATE DATA · NOT LIVE FLIGHT TELEMETRY</div>
	</div>;
}
