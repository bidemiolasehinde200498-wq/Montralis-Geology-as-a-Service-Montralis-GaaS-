import React from 'react';
import { useAuth } from '../auth/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const rows = [
    ['Name', user.name],
    ['Email', user.email],
    ['Title', user.title],
    ['Profile tag', user.role],
    ['Session expires', new Date(user.expires_at * 1000).toLocaleString()]
  ];
  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-2xl font-bold">User Profile</h2>
      <dl className="bg-slate-950 border border-slate-800 rounded-lg divide-y divide-slate-800">
        {rows.map(([k, val]) => (
          <div key={k} className="flex justify-between px-4 py-3 text-sm">
            <dt className="text-slate-500">{k}</dt>
            <dd>{val}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
