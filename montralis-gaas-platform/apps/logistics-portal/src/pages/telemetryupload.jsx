import React, { useState } from 'react';
import { api } from '../api';

function parseGrid(text) {
	const rows = text.trim().split(/\r?\n/).map((line) => line.split(/[,;\t]/).map((cell) => Number(cell.trim())));
	if (rows.length < 2 || rows[0].length < 2) throw new Error('A grid needs at least 2 rows and 2 columns.');
	if (rows.length > 256 || rows[0].length > 256 || rows.some((row) => row.length !== rows[0].length)) throw new Error('Grid must be rectangular and no larger than 256 by 256 cells.');
	if (rows.some((row) => row.some((value) => !Number.isFinite(value)))) throw new Error('Every cell must contain a finite numeric value. Remove headers and empty cells.');
	return rows;
}

export default function TelemetryUpload() {
	const [kind, setKind] = useState('aeromagnetic');
	const [file, setFile] = useState(null);
	const [grid, setGrid] = useState(null);
	const [bounds, setBounds] = useState({ west: '28.0', south: '-13.8', east: '28.2', north: '-13.6' });
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [result, setResult] = useState(null);

	const chooseFile = async (event) => {
		const chosen = event.target.files?.[0];
		setFile(chosen || null);
		setGrid(null);
		setResult(null);
		setError('');
		if (!chosen) return;
		if (chosen.size > 5_000_000) { setError('File exceeds the 5 MB demo limit.'); return; }
		try { setGrid(parseGrid(await chosen.text())); }
		catch (err) { setError(err.message); }
	};

	const submit = async (event) => {
		event.preventDefault();
		setError('');
		setResult(null);
		if (!grid) { setError('Choose a valid numeric grid first.'); return; }
		setBusy(true);
		try {
			const values = Object.fromEntries(Object.entries(bounds).map(([key, value]) => [key, Number(value)]));
			if (!(values.west < values.east && values.south < values.north)) throw new Error('Bounds must have west < east and south < north.');
			const mesh = await api('/api/v1/gaas/fusion/mesh-preview', {
				method: 'POST',
				body: JSON.stringify({ bounds: [values.west, values.south, values.east, values.north], layers: { [kind]: grid } })
			});
			setResult({ ...mesh, fileName: file.name, kind });
		} catch (err) { setError(err.message || 'Could not process this grid.'); }
		finally { setBusy(false); }
	};

	return <div className="page-stack">
		<header className="page-heading"><div><p className="eyebrow">MISSION CONTROL / DATA INGESTION</p><h1>Upload sensor data</h1><p>Validate a numeric sensor matrix and send a georeferenced preview to the unified fusion engine.</p></div><span className="raw-file-tag">RAW FILE / CSV</span></header>
		<div className="upload-layout">
			<form className="upload-form" onSubmit={submit}>
				<div className="form-section-heading"><span>01</span><div><h2>Sensor package</h2><p>CSV numeric matrix, no header; one grid row per line.</p></div></div>
				<label className="upload-drop"><input type="file" accept=".csv,.txt,text/csv,text/plain" onChange={chooseFile} /><span className="upload-icon">↑</span><strong>{file?.name || 'Choose a sensor grid'}</strong><small>{grid ? `${grid.length} × ${grid[0].length} numeric cells ready` : 'CSV or TXT · up to 5 MB · maximum 256 × 256'}</small></label>
				<div className="segmented-control" role="group" aria-label="Sensor type"><button type="button" onClick={() => setKind('aeromagnetic')} className={kind === 'aeromagnetic' ? 'selected' : ''}>Aeromagnetic</button><button type="button" onClick={() => setKind('thermal_infrared')} className={kind === 'thermal_infrared' ? 'selected' : ''}>Thermal IR</button></div>
				<div className="bounds-grid">
					{Object.entries(bounds).map(([key, value]) => <label key={key}>{key}<input required type="number" step="any" value={value} onChange={(event) => setBounds({ ...bounds, [key]: event.target.value })} /></label>)}
				</div>
				{error && <p role="alert" className="error-message">{error}</p>}
				<button className="action-button" disabled={busy || !grid}>{busy ? 'Processing fusion preview…' : 'Send to data fusion'}<span aria-hidden="true">→</span></button>
				<p className="disclaimer">The existing API returns an in-memory mesh preview. It does not persist the raw file, provide a permanent sensor record or return a flight/job payment.</p>
			</form>
			<section className="fusion-status-panel"><div className="panel-heading"><div><p className="eyebrow">PIPELINE / PYTHON ENGINE</p><h2>Fusion status</h2></div><span className="engine-badge">GaaS API</span></div>
				{!result && <div className="pipeline-steps"><div className="pipeline-step active"><i>1</i><span><strong>File validation</strong><small>Rectangular numeric matrix</small></span></div><div className="pipeline-step"><i>2</i><span><strong>Georeference</strong><small>WGS84 bounds supplied</small></span></div><div className="pipeline-step"><i>3</i><span><strong>Raster fusion</strong><small>data_fusion.py processing</small></span></div><div className="pipeline-step"><i>4</i><span><strong>Surface preview</strong><small>Relative index, not depth</small></span></div></div>}
				{result && <div className="result-summary"><span className="result-check">✓</span><h3>Preview generated</h3><p>{result.fileName} · {result.kind.replaceAll('_', ' ')}</p><div className="result-stats"><span><strong>{result.valid_vertex_count}</strong><small>vertices</small></span><span><strong>{result.faces.length}</strong><small>triangles</small></span></div><p className="disclaimer">This is a relative surface anomaly preview, not mineral identification, depth or a certified survey result.</p></div>}
			</section>
		</div>
	</div>;
}
