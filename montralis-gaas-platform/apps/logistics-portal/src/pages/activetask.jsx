import React, { useState } from 'react';
import MapRadar from '../components/mapradar';

export default function ActiveTask({ jobs, loading }) {
	const [selected, setSelected] = useState(null);
	const visible = selected ? [selected] : jobs;
	const activeJobs = jobs.filter((job) => ['Assigned', 'In progress'].includes(job.status));

	return <div className="page-stack">
		<header className="page-heading"><div><p className="eyebrow">MISSION CONTROL / FLIGHT GUIDANCE</p><h1>Active flight guidance</h1><p>Field task locations and dispatch states from registered work tickets.</p></div><span className="flight-code">{selected?.job_reference || activeJobs[0]?.job_reference || 'NO ACTIVE TASK'}</span></header>
		<div className="flight-status-strip"><span className="status-pill offline"><i /> GPS telemetry unavailable</span><span>Displayed positions are task coordinates. Live aircraft location, heading and altitude are not connected.</span></div>
		<div className="flight-grid">
			<section className="map-panel flight-map"><div className="panel-heading"><div><p className="eyebrow">REGISTERED TARGET POSITIONS</p><h2>{selected?.target_name || 'Dispatch overview'}</h2></div><span>{visible.length} pinned</span></div><MapRadar missions={visible} selected={selected} onSelect={setSelected} height="100%" /></section>
			<section className="task-queue"><div className="panel-heading"><div><p className="eyebrow">FIELD DISPATCH</p><h2>Work tickets</h2></div><span>{jobs.length}</span></div>
				{loading && <p className="empty-state">Loading dispatch tickets…</p>}
				{!loading && jobs.length === 0 && <p className="empty-state">No tickets yet. Request a field task from the gig marketplace.</p>}
				{jobs.map((job) => <button key={job.id} onClick={() => setSelected(job)} className={`task-row ${selected?.id === job.id ? 'selected' : ''}`}>
					<span className="task-dot"/><span className="task-row-copy"><strong>{job.target_name}</strong><small>{job.job_reference} · {job.scheduled_date || 'Unscheduled'}</small></span><span className={`task-status ${job.status?.toLowerCase().replaceAll(' ', '-')}`}>{job.status}</span>
				</button>)}
				<p className="disclaimer compact-disclaimer">Dispatch records can be created in this demo; changing a ticket’s status requires a backend workflow not currently provided.</p>
			</section>
		</div>
	</div>;
}
