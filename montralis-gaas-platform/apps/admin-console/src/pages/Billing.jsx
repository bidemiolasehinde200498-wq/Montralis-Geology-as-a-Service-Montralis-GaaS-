import React from 'react';

export default function Billing() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-xl font-bold">Universal Billing Summaries</h2>
      <p className="text-xs text-amber-400">Sample data: not yet connected to the clearinghouse ledger.</p>
      <table className="w-full text-sm bg-slate-950 border border-slate-800 rounded">
        <thead className="text-slate-400 text-xs uppercase bg-slate-900">
          <tr><th className="text-left px-4 py-2">Stream</th><th className="text-left px-4 py-2">Period</th><th className="text-left px-4 py-2">Amount</th></tr>
        </thead>
        <tbody>
          {[['Clearinghouse take (2%)', '2026-Q3', '£0.00'], ['Cadastre micro-fees (1.5%)', '2026-Q3', '£0.00'], ['SaaS subscriptions', '2026-Q3', '£0.00']].map((r) => (
            <tr key={r[0]} className="border-t border-slate-800">
              {r.map((c) => <td key={c} className="px-4 py-2">{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
