import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, api, type AuthUser } from './api';

export type AuthMode = 'guest' | 'authed';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  mode: AuthMode;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const API_DISABLED = import.meta.env.VITE_API_DISABLED === '1';

/** Fired when any API call gets 401 (expired/invalid session). */
export const SESSION_EXPIRED_EVENT = 'focus-matrix:session-expired';

export function notifySessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(!API_DISABLED);

  useEffect(() => {
    if (API_DISABLED) return;
    let cancelled = false;
    api
      .me()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch((e) => {
        // 401 = simply logged out; network failure = backend down → guest.
        if (!cancelled && !(e instanceof ApiError)) console.warn('auth /me failed, guest mode', e);
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    const onExpired = () => {
      // Session died mid-use: clear cookie best-effort, drop to guest.
      api.logout().catch(() => {});
      setUser(null);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await api.login({ email, password });
    setUser(u);
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const u = await api.signup({ email, password, name });
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, mode: user ? 'authed' : 'guest', login, signup, logout }),
    [user, loading, login, signup, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
