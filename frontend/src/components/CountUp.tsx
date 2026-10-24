import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  duration?: number;
}

export default function CountUp({ value, duration = 1400 }: Props) {
  const [display, setDisplay] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value, duration]);

  return <>{display.toLocaleString()}</>;
}