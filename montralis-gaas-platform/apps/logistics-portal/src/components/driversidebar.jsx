import React from 'react';

const NAV = [
	{ id: 'marketplace', group: 'Mission Control', title: 'Open gig marketplace', symbol: '◉' },
	{ id: 'flight', group: 'Mission Control', title: 'Active flight guidance', symbol: '⌖' },
	{ id: 'upload', group: 'Mission Control', title: 'Upload sensor data', symbol: '↑' },
	{ id: 'calibration', group: 'Hardware & Audit', title: 'Sensor calibration', symbol: '◇' },
	{ id: 'receipts', group: 'Hardware & Audit', title: 'Historical bank receipts', symbol: '≡' }
];

export default function DriverSidebar({ user, active, onNavigate, onLogout, live, gigs, pending, collapsed, onToggle, mobileOpen, onClose }) {
	return <>
		{mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={onClose} />}
		<aside className={`driver-sidebar ${collapsed && !mobileOpen ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
			<div className="sidebar-brand"><span className="brand-mark">M</span>{!collapsed && <div><strong>MONTRALIS</strong><small>LOGISTICS HUB</small></div>}<button className="mobile-close" onClick={onClose} aria-label="Close menu">×</button></div>
			{!collapsed && <div className="connection-card"><span className={`status-dot ${live ? 'online' : ''}`} /><div><strong>{live ? 'Core system online' : 'Core system offline'}</strong><small>API handshake {live ? 'active' : 'unavailable'}</small></div><span className="connection-indicator">{live ? 'LIVE' : 'OFF'}</span></div>}
			<nav className="driver-nav" aria-label="Logistics navigation">
				{['Mission Control', 'Hardware & Audit'].map((group) => <div className="nav-group" key={group}>
					{!collapsed && <p className="nav-caption">{group}</p>}
					{NAV.filter((item) => item.group === group).map((item) => <button key={item.id} className={`nav-link ${active === item.id ? 'active' : ''}`} onClick={() => { onNavigate(item.id); onClose(); }} title={collapsed ? item.title : undefined} aria-current={active === item.id ? 'page' : undefined}>
						<span className="nav-symbol" aria-hidden="true">{item.symbol}</span>{!collapsed && <><span className="nav-title">{item.title}</span>{item.id === 'marketplace' && gigs > 0 && <span className="nav-count">{gigs}</span>}</>}
					</button>)}
				</div>)}
			</nav>
			{!collapsed && <div className="sidebar-escrow"><p className="nav-caption">Financial ledger</p><div className="escrow-line"><span>Pending records</span><strong>{pending}</strong></div><small>Calculated from saved payout entries</small></div>}
			<div className="sidebar-bottom">
				<div className="pilot-avatar">{user.name?.slice(0, 1).toUpperCase() || 'P'}</div>
				{!collapsed && <div className="pilot-info"><strong>{user.name}</strong><small>{user.title || user.role.replaceAll('_', ' ')}</small></div>}
				<button className="offline-button" onClick={onLogout} title="Sign out and clear session" aria-label="Sign out">⏻</button>
			</div>
			<button type="button" className="collapse-button" onClick={onToggle} aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}>{collapsed ? '›' : '‹'}{!collapsed && <span>Collapse sidebar</span>}</button>
		</aside>
	</>;
}
