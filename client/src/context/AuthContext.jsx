import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest('/auth/me')
      .then(({ user: currentUser }) => { if (active) setUser(currentUser); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    async login(credentials) {
      const result = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
      setUser(result.user);
      return result.user;
    },
    async register(details) {
      const result = await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(details) });
      setUser(result.user);
      return result.user;
    },
    async logout() {
      await apiRequest('/auth/logout', { method: 'POST' });
      setUser(null);
    },
    updateUser(updatedUser) { setUser(updatedUser); },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
