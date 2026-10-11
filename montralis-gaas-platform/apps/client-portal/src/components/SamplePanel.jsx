import React from 'react';

export default function SamplePanel({ title, description, columns, rows }) {
  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <p className="text-xs text-amber-400">Sample data: this module is not yet connected to a backend service.</p>
      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
            <tr>{columns.map((c) => <th key={c} className="text-left px-4 py-2">{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-800">
                {r.map((cell, j) => <td key={j} className="px-4 py-2">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
