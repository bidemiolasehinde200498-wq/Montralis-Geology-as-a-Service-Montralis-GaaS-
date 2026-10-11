import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

const MINERALS = ['Lithium', 'Copper', 'Cobalt', 'Graphite', 'Nickel'];

const FEATURES = [
  ['Satellite spectrometry', 'Multi-spectral band ratios highlight mineral signatures across whole regions.'],
  ['Ranked drill targets', 'Detected anomalies are scored by spectral confidence and estimated tonnage.'],
  ['Digital offtake', 'Lock exclusive extraction rights to identified coordinates with a digital agreement.']
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.status === 429 ? 'Too many attempts. Try again later.' : 'Invalid credentials.');
    }
    setPassword('');
    setBusy(false);
  };

  const field =
    'w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition';

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-950 text-white">
      <section className="relative hidden lg:flex flex-col justify-between p-14 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950">M</div>
          <span className="text-lg font-bold tracking-widest">MONTRALIS</span>
        </div>

        <div className="relative space-y-8 max-w-lg">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">Geology as a Service</p>
            <h1 className="text-4xl font-bold leading-tight">Find critical minerals from orbit, before you drill.</h1>
            <p className="text-slate-400 leading-relaxed">
              Montralis Geology-as-a-Service turns satellite imagery into actionable exploration targets. Mining
              cooperatives run spectral scans, review ranked anomalies and secure offtake agreements from a
              single portal, without the cost of a traditional survey campaign.
            </p>
          </div>

          <ul className="space-y-4">
            {FEATURES.map(([title, text]) => (
              <li key={title} className="flex space-x-3">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <p className="text-sm text-slate-400">
                  <span className="font-semibold text-slate-200">{title}.</span> {text}
                </p>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2">
            {MINERALS.map((m) => (
              <span key={m} className="text-xs px-3 py-1 rounded-full border border-emerald-500/30 text-emerald-300">
                {m}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-600">© Montralis. All rights reserved.</p>
      </section>

      <section className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div className="lg:hidden flex items-center space-x-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-slate-950">M</div>
            <span className="font-bold tracking-widest">MONTRALIS</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-sm text-slate-500">Sign in to your exploration cockpit.</p>
          </div>

          <div>
            <label htmlFor="portal" className="block text-xs font-semibold uppercase text-slate-500 mb-1">Access type</label>
            <select id="portal" className={field} defaultValue="client">
              <option value="client">Client Login</option>
            </select>
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase text-slate-500 mb-1">Email</label>
            <input id="email" type="email" required autoComplete="username" maxLength={254}
              value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase text-slate-500 mb-1">Password</label>
            <input id="password" type="password" required autoComplete="current-password" maxLength={128}
              value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
          </div>

          {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}

          <button type="submit" disabled={busy}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-bold py-3 rounded-lg transition">
            {busy ? 'Verifying…' : 'Login'}
          </button>
        </form>
      </section>
    </div>
  );
}
