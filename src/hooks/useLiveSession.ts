import { useState, useEffect, useRef, useCallback } from 'react';
import type { OpenF1Session, LivePhase } from '../types';

const OPENF1 = 'https://api.openf1.org/v1';
const GRACE_MS = 30 * 60 * 1000; // 30 min after session ends

export interface LiveSessionInfo {
  session: OpenF1Session | null;
  phase: LivePhase;
  isLive: boolean;
}

export function useLiveSession(): LiveSessionInfo {
  const [session, setSession] = useState<OpenF1Session | null>(null);
  const [phase, setPhase] = useState<LivePhase>('NONE');
  const sessionEndedAt = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = useCallback(async () => {
    try {
      const res = await fetch(`${OPENF1}/sessions?session_key=latest`);
      if (!res.ok) return;
      const data: OpenF1Session[] = await res.json();
      const s = data[0];
      if (!s) return;

      const now = Date.now();
      const start = new Date(s.date_start).getTime();
      const end = new Date(s.date_end).getTime();
      const isWithinWindow = now >= start && now <= end + 3_600_000;
      const isRaceSession =
        s.session_name?.toLowerCase().includes('race') &&
        !s.session_name?.toLowerCase().includes('sprint qualifying') &&
        !s.session_name?.toLowerCase().includes('practice');

      if (isWithinWindow && isRaceSession) {
        // actively live
        sessionEndedAt.current = null;
        setSession(s);
        setPhase('LIVE');
      } else if (!isWithinWindow && isRaceSession) {
        // session ended — start grace period if not already started
        if (sessionEndedAt.current === null) {
          sessionEndedAt.current = now;
        }
        if (now - sessionEndedAt.current < GRACE_MS) {
          setSession(s);
          setPhase('COMPLETE');
        } else {
          setSession(null);
          setPhase('NONE');
          sessionEndedAt.current = null;
        }
      } else {
        // not a race session at all
        if (phase === 'LIVE' || phase === 'COMPLETE') {
          if (sessionEndedAt.current === null) sessionEndedAt.current = now;
          if (now - sessionEndedAt.current < GRACE_MS) return; // keep current
        }
        setSession(null);
        setPhase('NONE');
      }
    } catch {
      // silently ignore — keep previous state
    }
  }, [phase]);

  useEffect(() => {
    check();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-schedule interval whenever phase changes (10s live, 30s otherwise)
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const delay = phase === 'LIVE' ? 10_000 : 30_000;
    intervalRef.current = setInterval(check, delay);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase, check]);

  return { session, phase, isLive: phase === 'LIVE' };
}
