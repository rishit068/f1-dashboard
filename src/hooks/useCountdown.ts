import { useState, useEffect } from 'react';
import type { CountdownTime } from '../types';

export function useCountdown(targetDateStr: string | null): CountdownTime {
  const [time, setTime] = useState<CountdownTime>({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    if (!targetDateStr) return;

    const tick = () => {
      const target = new Date(targetDateStr).getTime();
      const diff = target - Date.now();
      if (diff <= 0) {
        setTime({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }
      const days  = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins  = Math.floor((diff % 3600000)  / 60000);
      const secs  = Math.floor((diff % 60000)    / 1000);
      setTime({ days, hours, mins, secs });
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDateStr]);

  return time;
}
