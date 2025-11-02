import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('demo_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (user) localStorage.setItem('demo_user', JSON.stringify(user));
      else localStorage.removeItem('demo_user');
    } catch {}
  }, [user]);

  const login = (email) => setUser({ email });
  const logout = () => setUser(null);

  const value = useMemo(
    () => ({ isAuthenticated: !!user, user, login, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
