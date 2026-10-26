import { useEffect, useState } from 'react';

/** Counts down from the given number of seconds. Returns null when no timer is wanted. */
export function useCountdown(initialSeconds: number | null): number | null {
  const [endAt] = useState<number | null>(() =>
    initialSeconds === null ? null : Date.now() + initialSeconds * 1000,
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [endAt]);

  if (endAt === null) return null;
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}