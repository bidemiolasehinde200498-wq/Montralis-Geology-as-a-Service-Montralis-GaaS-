import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api('/api/v1/auth/me').then((profile) => { if (active) setUser(profile); }).catch(() => {
      if (active) setUser(null);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const login = useCallback(async (email, password) => {
    const profile = await api('/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password, portal: 'client' }) });
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(async () => {
    try { await api('/api/v1/auth/logout', { method: 'POST' }); } finally { setUser(null); }
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
