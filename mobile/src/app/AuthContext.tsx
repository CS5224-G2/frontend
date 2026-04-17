import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthResult, AuthUser } from '../../../shared/types/index';
import { registerSessionExpiredHandler } from '../services/authEvents';
import { clearSession, isTokenExpired, loadSession, saveSession } from '../services/secureSession';
import { loadActiveRideSession } from '../services/activeRideSession';

interface AuthContextType {
  /** True once the secure-storage restore check has completed. */
  isRestoring: boolean;
  isLoggedIn: boolean;
  role: 'user' | 'admin' | 'business' | null;
  user: AuthUser | null;
  /** Persist the full AuthResult and mark the user as logged in. */
  login: (result: AuthResult) => Promise<void>;
  /** Wipe secure storage and clear in-memory auth state. */
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  isRestoring: true,
  isLoggedIn: false,
  role: null,
  user: null,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isRestoring, setIsRestoring] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<'user' | 'admin' | 'business' | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Register the session-expired handler so httpClient can trigger logout on 401.
  useEffect(() => {
    registerSessionExpiredHandler(() => {
      setIsLoggedIn(false);
      setRole(null);
      setUser(null);
    });
  }, []);

  // Restore session from SecureStore on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await loadSession();
        if (!cancelled && stored) {
          // If the token is expired, only keep the session alive when there is
          // an active ride — so the user isn’t logged out mid-ride. In all
          // other cases wipe the stale token immediately.
          const expired = await isTokenExpired();
          if (expired) {
            const activeRide = await loadActiveRideSession().catch(() => null);
            if (!activeRide) {
              await clearSession().catch(() => {});
              return; // leaves isLoggedIn = false
            }
          }
          setIsLoggedIn(true);
          setRole(stored.user.role);
          setUser(stored.user);
        }
      } catch {
        // Silently ignore restore errors — user will need to log in again.
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (result: AuthResult) => {
    await saveSession(result);
    setIsLoggedIn(true);
    setRole(result.user.role);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
    setIsLoggedIn(false);
    setRole(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ isRestoring, isLoggedIn, role, user, login, logout }),
    [isRestoring, isLoggedIn, role, user, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
