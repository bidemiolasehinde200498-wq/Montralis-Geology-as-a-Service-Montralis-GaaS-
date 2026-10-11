import React from 'react';

const gbp = (value) => `£${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Receipts({ payouts, loading }) {
  const total = payouts.reduce((sum, payout) => sum + Number(payout.calculated_payout_gbp || 0), 0);
  const pending = payouts.filter((payout) => payout.payment_status === 'Pending');
  const paid = payouts.filter((payout) => payout.payment_status === 'Paid');
  return <div className="page-stack">
    <header className="page-heading"><div><p className="eyebrow">HARDWARE & AUDIT / LEDGER</p><h1>Historical bank receipts</h1><p>Recorded cooperative payout entries and their declared payment status.</p></div><span className="ledger-tag">TX / LEDGER</span></header>
    <div className="ledger-notice"><strong>Platform records only.</strong> M-Pesa, Airtel Money and bank settlement providers are not connected. “Paid” is an entered record, not independent payment confirmation.</div>
    <div className="ledger-metrics"><article><small>Calculated total</small><strong>{gbp(total)}</strong><span>From {payouts.length} recorded payout row(s)</span></article><article><small>Pending entries</small><strong>{pending.length}</strong><span>{gbp(pending.reduce((sum, payout) => sum + Number(payout.calculated_payout_gbp || 0), 0))} calculated amount</span></article><article><small>Paid status entries</small><strong>{paid.length}</strong><span>Not independently verified</span></article></div>
    <section className="table-panel"><div className="panel-heading"><div><p className="eyebrow">COOPERATIVE PAYOUT LEDGER</p><h2>Transaction records</h2></div><span>{payouts.length} rows</span></div>
      {loading ? <p className="empty-state">Loading payout records…</p> : payouts.length === 0 ? <p className="empty-state">No payout records are available for this account.</p> : <div className="table-scroll"><table><thead><tr><th>Weigh ticket</th><th>Mineral</th><th>Mine site</th><th>Weight</th><th>Rate</th><th>Calculated</th><th>Status</th><th>Recorded</th></tr></thead><tbody>{payouts.map((payout) => <tr key={payout.id}><td>{payout.weigh_ticket}</td><td>{payout.mineral}</td><td>{payout.mine_site}</td><td>{Number(payout.weight_tonnes).toLocaleString()} t</td><td>{gbp(payout.payout_rate_gbp_per_tonne)}/t</td><td className="amount-cell">{gbp(payout.calculated_payout_gbp)}</td><td><span className={`payment-status ${payout.payment_status?.toLowerCase()}`}>{payout.payment_status}</span></td><td>{payout.created_at ? new Date(payout.created_at).toLocaleDateString() : '—'}</td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
