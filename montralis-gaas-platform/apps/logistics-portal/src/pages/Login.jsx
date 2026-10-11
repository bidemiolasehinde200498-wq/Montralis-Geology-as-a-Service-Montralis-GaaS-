import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try { await login(email, password); }
    catch (err) { setError(err.status === 429 ? 'Too many attempts. Try again shortly.' : 'Invalid client portal credentials.'); }
    finally { setPassword(''); setBusy(false); }
  };

  return <main className="login-page">
    <div className="login-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="terrain-line"/></div>
    <section className="login-panel">
      <div className="brand-lockup"><span className="brand-mark">M</span><span>MONTRALIS <small>LOGISTICS HUB</small></span></div>
      <div className="login-intro"><p className="eyebrow">FIELD OPERATIONS / SECURE ACCESS</p><h1>Fieldwork, connected.</h1><p>Coordinate prospecting missions, manage field records and review recorded payouts in one place.</p></div>
      <form onSubmit={submit} className="login-form">
        <label>Email<input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="pilot@organization.com" /></label>
        <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <p role="alert" className="error-message">{error}</p>}
        <button disabled={busy}>{busy ? 'Connecting…' : 'Sign in'}<span aria-hidden="true">→</span></button>
      </form>
      <p className="login-footnote">Use a provisioned Montralis client account. Field GPS and mobile-money connections are not configured in this demo.</p>
    </section>
  </main>;
}
