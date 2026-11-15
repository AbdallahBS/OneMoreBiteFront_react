import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchSessionProfile, loginRequest, logoutRequest } from '../api/auth';
import { ROLE_BY_KEY } from '../lib/roles';

const STORAGE_KEY = 'omb.session';

const AuthContext = createContext(null);

function readStoredSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

function mergeProfile(profile, fallback) {
  if (!profile || typeof profile !== 'object') {
    return fallback;
  }

  return {
    ...fallback,
    ...profile,
    role: profile.role || fallback.role,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());
  const [booting, setBooting] = useState(() => Boolean(readStoredSession()?.token));

  useEffect(() => {
    let active = true;
    const token = session?.token;

    if (!token) {
      setBooting(false);
      return undefined;
    }

    setBooting(true);

    fetchSessionProfile(token)
      .then((profile) => {
        if (!active) {
          return;
        }

        setSession((current) =>
          current?.token === token
            ? { ...current, user: mergeProfile(profile, current.user || {}) }
            : current,
        );
      })
      .catch(() => {
        if (active) {
          setSession(null);
        }
      })
      .finally(() => {
        if (active) {
          setBooting(false);
        }
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (session?.token) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [session]);

  const login = useCallback(async (roleKey, credentials) => {
    const role = ROLE_BY_KEY[roleKey];

    if (!role) {
      throw new Error('Veuillez choisir un type de compte.');
    }

    const response = await loginRequest(role.backendRole, credentials);

    if (!response?.token) {
      throw new Error("Le serveur n'a pas renvoyé de jeton de session.");
    }

    if (response.role && response.role !== role.backendRole) {
      throw new Error(
        `Ce compte correspond au rôle ${response.role}. Choisissez le bon type de compte.`,
      );
    }

    const fallbackUser = {
      id: response.id,
      nom: response.nom,
      email: response.email,
      role: role.backendRole,
    };

    let user = fallbackUser;

    try {
      const profile = await fetchSessionProfile(response.token);
      user = mergeProfile(profile, fallbackUser);
    } catch {
      // The login response already contains enough information to start a session.
    }

    const nextSession = { token: response.token, user };
    setSession(nextSession);
    setBooting(false);

    return nextSession;
  }, []);

  const logout = useCallback(async () => {
    const token = session?.token;
    setSession(null);

    if (token) {
      try {
        await logoutRequest(token);
      } catch {
        // Local session is cleared even if the server is unreachable.
      }
    }
  }, [session?.token]);

  const reloadSession = useCallback(async () => {
    const token = session?.token;
    if (!token) return;

    try {
      const profile = await fetchSessionProfile(token);
      setSession((current) =>
        current?.token === token
          ? { ...current, user: mergeProfile(profile, current.user || {}) }
          : current,
      );
    } catch {
      // ignore
    }
  }, [session?.token]);

  const value = useMemo(
    () => ({
      session,
      token: session?.token ?? null,
      user: session?.user ?? null,
      role: session?.user?.role ?? null,
      isAuthenticated: Boolean(session?.token),
      booting,
      login,
      logout,
      reloadSession,
    }),
    [session, booting, login, logout, reloadSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }

  return context;
}
