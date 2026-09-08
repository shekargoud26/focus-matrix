import { useCallback, useEffect, useState } from 'react';
import type { Profile } from '../types';
import { ApiError, api } from './api';
import { notifySessionExpired, type AuthMode } from './auth';

const GUEST_KEY = 'focus-matrix-profile';
const SERVER_CACHE_KEY = 'focus-matrix-profile-cache';

const DEFAULT_PROFILE: Profile = { name: 'Alex Developer', title: 'Productivity Enthusiast' };

function loadGuestProfile(): Profile {
  try {
    const saved = localStorage.getItem(GUEST_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<Profile>;
      return { name: parsed.name || DEFAULT_PROFILE.name, title: parsed.title || DEFAULT_PROFILE.title };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_PROFILE };
}

/** Profile state: guest localStorage vs server-synced (with cache fallback). */
export function useProfile(mode: AuthMode) {
  const [profile, setProfileState] = useState<Profile>(() => loadGuestProfile());

  useEffect(() => {
    if (mode === 'guest') {
      try {
        localStorage.setItem(GUEST_KEY, JSON.stringify(profile));
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, mode]);

  useEffect(() => {
    if (mode !== 'authed') {
      setProfileState(loadGuestProfile());
      return;
    }
    let cancelled = false;
    api
      .getProfile()
      .then((p) => {
        if (cancelled) return;
        const next = { name: p.name || DEFAULT_PROFILE.name, title: p.title || DEFAULT_PROFILE.title };
        setProfileState(next);
        try {
          localStorage.setItem(SERVER_CACHE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          if (!cancelled) notifySessionExpired();
          return;
        }
        if (!(e instanceof ApiError)) console.warn('profile sync failed, using cache', e);
        if (cancelled) return;
        try {
          const cached = localStorage.getItem(SERVER_CACHE_KEY);
          if (cached) setProfileState(JSON.parse(cached) as Profile);
        } catch {
          // keep current
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const updateProfile = useCallback(
    async (next: Profile) => {
      setProfileState(next);
      if (mode === 'authed') {
        try {
          await api.updateProfile({ name: next.name, title: next.title });
        } catch (e) {
          console.warn('profile update failed', e);
        }
        // Mirror locally even if the server write failed so offline
        // refresh keeps the latest edit instead of a stale cache.
        try {
          localStorage.setItem(SERVER_CACHE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
      }
    },
    [mode],
  );

  return { profile, updateProfile };
}
