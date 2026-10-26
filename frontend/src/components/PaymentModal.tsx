import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { Booking } from '../types';
import PaymentForm from './PaymentForm';
import Portal from './Portal';

interface Props {
  booking: Booking;
  secondsLeft: number;
  onPaid: (booking: Booking) => void;
  onClose: () => void;
}

export default function PaymentModal({ booking, secondsLeft, onPaid, onClose }: Props) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Close on Escape + lock page scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-ink-950/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-[94dvh] w-full max-w-md animate-fade-up overflow-y-auto rounded-t-3xl border border-ink-800/10 bg-cream-50 shadow-2xl sm:rounded-3xl dark:border-gold-500/25 dark:bg-ink-800"
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ink-800/10 transition hover:bg-ink-800/20 dark:bg-white/10 dark:hover:bg-white/20"
          >
            <X size={18} />
          </button>
          <PaymentForm
            booking={booking}
            secondsLeft={secondsLeft}
            onPaid={onPaid}
            onClose={onClose}
          />
        </div>
      </div>
    </Portal>
  );
}