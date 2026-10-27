import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, TicketX, X } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import Portal from '../components/Portal';
import TicketCard from '../components/TicketCard';
import { useAuth } from '../context/AuthContext';
import { bookingApi, getErrorMessage } from '../lib/api';
import type { Booking } from '../types';

type Tab = 'upcoming' | 'past' | 'cancelled';

const TABS: { key: Tab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Used & past' },
  { key: 'cancelled', label: 'Cancelled' },
];

const EMPTY_TEXT: Record<Tab, string> = {
  upcoming: 'You have no upcoming tickets.',
  past: 'No used or past tickets yet.',
  cancelled: 'No cancelled bookings.',
};

function QrLightbox({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  if (!booking.ticket) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-md"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm animate-fade-up rounded-3xl border border-gold-500/30 bg-cream-50 p-6 text-center shadow-2xl dark:bg-ink-800"
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink-800/10 transition hover:bg-ink-800/20 dark:bg-white/10"
          >
            <X size={16} />
          </button>
          <h3 className="font-display text-xl font-semibold">{booking.eventTitle}</h3>
          <p className="muted mt-1 text-xs">
            {booking.bookedSeats} seat{booking.bookedSeats > 1 ? 's' : ''} · Booking #{booking.id}
          </p>
          <img
            src={booking.ticket.qrCodeImage}
            alt="Ticket QR code"
            className="mx-auto mt-5 h-64 w-64 rounded-2xl bg-white p-3 shadow-md"
          />
          <p className="mt-4 break-all font-mono text-[11px] text-ink-800/70 dark:text-stone-300/70">
            {booking.ticket.qrCodeData}
          </p>
          <p className="muted mt-2 text-xs">Show this code at the entrance.</p>
        </div>
      </div>
    </Portal>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [zoom, setZoom] = useState<Booking | null>(null);
  const [payFor, setPayFor] = useState<{ booking: Booking; secondsLeft: number } | null>(null);
  const [now] = useState(() => Date.now());
  const [loadedAt, setLoadedAt] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    bookingApi
      .mine()
      .then((data) => {
        if (!active) return;
        setBookings(data);
        setLoadedAt(Date.now());
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  // Quiet refresh (no loading skeleton), used after the payment window closes
  const refresh = useCallback(() => {
    bookingApi
      .mine()
      .then((data) => {
        setBookings(data);
        setLoadedAt(Date.now());
      })
      .catch(() => undefined);
  }, []);

  const groups = useMemo(() => {
    const upcoming: Booking[] = [];
    const past: Booking[] = [];
    const cancelled: Booking[] = [];
    for (const b of bookings) {
      if (b.bookingStatus === 'CANCELLED') cancelled.push(b);
      else if (b.bookingStatus === 'PENDING_PAYMENT') upcoming.push(b); // waiting for payment
      else if (b.ticket?.verified || new Date(b.eventDate).getTime() < now) past.push(b);
      else upcoming.push(b);
    }
    return { upcoming, past, cancelled };
  }, [bookings, now]);

  const handleCancel = async (id: number) => {
    const updated = await bookingApi.cancel(id);
    setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
  };

  const handlePay = (b: Booking) => {
    const elapsed = Math.floor((Date.now() - loadedAt) / 1000);
    setPayFor({ booking: b, secondsLeft: Math.max(0, (b.holdSecondsLeft ?? 0) - elapsed) });
  };

  const handlePaid = (paid: Booking) => {
    setBookings((prev) => prev.map((b) => (b.id === paid.id ? paid : b)));
    setPayFor(null);
    setTab('upcoming');
    if (paid.ticket) setZoom(paid); // show the freshly issued QR code
  };

  const list = groups[tab];

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600 dark:text-gold-400">
          {user ? `Welcome, ${user.name.split(' ')[0]}` : 'My account'}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">My tickets</h1>
        <div className="mt-3 h-0.5 w-16 rounded-full bg-gradient-to-r from-gold-500 to-transparent" />
      </div>

      <div className="mb-6 inline-flex gap-1 rounded-xl border border-ink-800/10 bg-white p-1 dark:border-gold-500/15 dark:bg-ink-900/60">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? 'bg-ink-800 text-gold-300 shadow-sm dark:bg-gold-500 dark:text-ink-950'
                : 'text-ink-800/70 hover:text-ink-800 dark:text-stone-300/70 dark:hover:text-stone-100'
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-70">{groups[t.key].length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-5">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card h-56 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="card mx-auto max-w-md p-8 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={retry} className="btn-ghost mt-4">
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className="muted py-16 text-center">
          <TicketX size={42} className="mx-auto mb-3 opacity-60" />
          <p className="font-medium">{EMPTY_TEXT[tab]}</p>
          {tab === 'upcoming' && (
            <Link to="/" className="btn-gold mt-5">
              Browse events
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {list.map((b, i) => (
            <div
              key={b.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 6) * 70}ms` }}
            >
              <TicketCard
                booking={b}
                now={now}
                onCancel={handleCancel}
                onZoom={setZoom}
                onPay={handlePay}
              />
            </div>
          ))}
        </div>
      )}

      {payFor && (
        <PaymentModal
          booking={payFor.booking}
          secondsLeft={payFor.secondsLeft}
          onPaid={handlePaid}
          onClose={() => {
            setPayFor(null);
            refresh();
          }}
        />
      )}

      {zoom && <QrLightbox booking={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}