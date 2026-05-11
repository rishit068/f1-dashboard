import { useState, useEffect, useRef, useCallback } from 'react';
import type { OpenF1Session, LivePhase } from '../types';

const OPENF1 = 'https://api.openf1.org/v1';
const GRACE_MS = 30 * 60 * 1000;   // 30 min post-session
const STALE_MS = 6 * 60 * 60 * 1000; // 6 hrs — anything older is definitely not live

export interface LiveSessionInfo {
  session: OpenF1Session | null;
  phase: LivePhase;
  isLive: boolean;
  checking: boolean; // true until the very first check resolves
}

export function useLiveSession(): LiveSessionInfo {
  const [session, setSession] = useState<OpenF1Session | null>(null);
  const [phase, setPhase] = useState<LivePhase>('NONE');
  const [checking, setChecking] = useState(true);

  // Tracks when we first noticed the session end, keyed by session_key
  const sessionEndedAt = useRef<number | null>(null);
  const trackedSessionKey = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await fetch(`${OPENF1}/sessions?session_key=latest`);
      if (!res.ok) return;
      const data: OpenF1Session[] = await res.json();
      const s = data[0];
      if (!s) { setPhase('NONE'); setSession(null); return; }

      const now = Date.now();
      const start = new Date(s.date_start).getTime();
      const end   = new Date(s.date_end).getTime();

      const isRaceSession =
        s.session_name?.toLowerCase().includes('race') &&
        !s.session_name?.toLowerCase().includes('sprint qualifying') &&
        !s.session_name?.toLowerCase().includes('practice');

      // Definitely stale — session started more than 6 hours ago and is over
      const isStale = start < now - STALE_MS;
      const isWithinWindow = now >= start && now <= end + 3_600_000;

      if (isRaceSession && isWithinWindow && !isStale) {
        // Actively live
        trackedSessionKey.current = s.session_key;
        sessionEndedAt.current = null;
        setSession(s);
        setPhase('LIVE');

      } else if (isRaceSession && !isWithinWindow && !isStale) {
        // Session ended recently (within 6 hours) — enter grace period.
        // Only start the grace period clock if this is the session we were
        // already tracking (prevents cold-start false positives).
        const isKnownSession = trackedSessionKey.current === s.session_key;

        if (isKnownSession) {
          if (sessionEndedAt.current === null) sessionEndedAt.current = now;
          if (now - sessionEndedAt.current < GRACE_MS) {
            setSession(s);
            setPhase('COMPLETE');
          } else {
            trackedSessionKey.current = null;
            sessionEndedAt.current = null;
            setSession(null);
            setPhase('NONE');
          }
        } else {
          // Cold start with a recently-ended session we never saw live.
          // Show as COMPLETE only if it ended within the grace window itself.
          if (now - end < GRACE_MS) {
            trackedSessionKey.current = s.session_key;
            sessionEndedAt.current = end; // use actual end time, not now
            setSession(s);
            setPhase('COMPLETE');
          } else {
            setSession(null);
            setPhase('NONE');
          }
        }

      } else {
        // Not a race session, or too stale
        trackedSessionKey.current = null;
        sessionEndedAt.current = null;
        setSession(null);
        setPhase('NONE');
      }
    } catch {
      // Network error — keep previous state, don't flicker
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const delay = phase === 'LIVE' ? 10_000 : 30_000;
    intervalRef.current = setInterval(check, delay);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase, check]);

  return { session, phase, isLive: phase === 'LIVE', checking };
}
