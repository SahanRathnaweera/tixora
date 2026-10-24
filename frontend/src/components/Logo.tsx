import { useState } from 'react';
import { Ticket } from 'lucide-react';
import logoImg from '../assets/tixora logo.png';

interface Props {
  className?: string;
}

/** Tixora logo. Falls back to a gold ticket icon if the image cannot be loaded. */
export default function Logo({ className = 'h-10 w-10' }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`${className} flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-gold-400 to-gold-500 text-ink-950`}
      >
        <Ticket size={20} />
      </span>
    );
  }

  return (
    <img
      src={logoImg}
      alt="Tixora"
      onError={() => setFailed(true)}
      className={`${className} shrink-0 rounded-lg object-cover ring-1 ring-gold-500/30`}
    />
  );
}