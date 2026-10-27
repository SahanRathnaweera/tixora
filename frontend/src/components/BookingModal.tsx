import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CheckCircle2, MapPin, Minus, Plus, Ticket, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bookingApi, getErrorMessage } from '../lib/api';
import { formatDate, formatPrice, formatTime } from '../lib/format';
import type { Booking, EventItem } from '../types';
import PaymentForm from './PaymentForm';
import Portal from './Portal';

interface Props {
  event: EventItem;
  onClose: () => void;
  /** Called with the number of seats taken. A negative number gives seats back. */
  onBooked: (eventId: number, seats: number) => void;
}

type Step = 'details' | 'payment' | 'success';

const MAX_PER_BOOKING = 10;

const PATTERN_BG = {
  backgroundImage:
    'radial-gradient(rgba(201,164,92,0.18) 1px, transparent 1px), linear-gradient(135deg, #1A5547, #0B3027 55%, #08211A)',
  backgroundSize: '18px 18px, 100% 100%',
};

export default function BookingModal({ event, onClose, onBooked }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const maxSeats = Math.max(1, Math.min(MAX_PER_BOOKING, event.availableSeats));
  const [seats, setSeats] = useState(1);
  const [step, setStep] = useState<Step>('details');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [heldSeconds, setHeldSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  // Always call the latest onClose without re-running the effect below
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Close on Escape + lock page scroll while the modal is open
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

  const total = event.price * seats;
  const isFree = event.price === 0;

  // Step 1: hold the seats
  const handleContinue = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await bookingApi.create(event.id, seats);
      setBooking(result);
      onBooked(event.id, seats);
      if (result.bookingStatus === 'CONFIRMED') {
        setStep('success'); // free event: nothing to pay
      } else {
        setHeldSeconds(result.holdSecondsLeft ?? 0);
        setStep('payment');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 finished
  const handlePaid = (paid: Booking) => {
    setBooking(paid);
    setStep('success');
  };

  // The hold ran out: the server released the seats, so show them again on the page
  const handleExpired = useCallback(() => {
    if (booking) onBooked(event.id, -booking.bookedSeats);
  }, [booking, event.id, onBooked]);

  const goToSignIn = () => {
    onClose();
    navigate('/login', { state: { from: '/' } });
  };

  const goToTickets = () => {
    onClose();
    navigate('/dashboard');
  };

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
          className="relative max-h-[94dvh] w-full max-w-lg animate-fade-up overflow-y-auto rounded-t-3xl border border-ink-800/10 bg-cream-50 shadow-2xl sm:rounded-3xl dark:border-gold-500/25 dark:bg-ink-800"
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ink-950/50 text-stone-100 backdrop-blur transition hover:bg-ink-950/80"
          >
            <X size={18} />
          </button>

          {/* ================= Step 3: success ================= */}
          {step === 'success' && booking && (
            <div className="p-6 text-center sm:p-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 size={36} className="text-emerald-500" />
              </div>
              <h2 className="mt-4 font-display text-3xl font-semibold">Booking confirmed</h2>
              <p className="muted mt-1 text-sm">
                {booking.bookedSeats} seat{booking.bookedSeats > 1 ? 's' : ''} for{' '}
                <span className="font-semibold">{booking.eventTitle}</span>
              </p>
              {booking.cardLast4 && (
                <p className="muted mt-1 text-xs">
                  Paid with card •••• {booking.cardLast4}
                  {booking.paymentReference ? ` · ${booking.paymentReference}` : ''}
                </p>
              )}

              {booking.ticket && (
                <div className="mx-auto mt-6 max-w-[17rem] overflow-hidden rounded-2xl border border-gold-500/40 bg-white shadow-lg">
                  <div className="p-4">
                    <img
                      src={booking.ticket.qrCodeImage}
                      alt="Ticket QR code"
                      className="mx-auto h-48 w-48"
                    />
                  </div>
                  <div className="border-t border-dashed border-gold-500/50 bg-cream-100 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-700">
                      Booking #{booking.id} · {formatPrice(booking.totalPrice)}
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] text-ink-800">
                      {booking.ticket.qrCodeData}
                    </p>
                  </div>
                </div>
              )}

              <p className="muted mt-4 text-xs">Show this QR code at the entrance.</p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button onClick={goToTickets} className="btn-gold flex-1">
                  View my tickets
                </button>
                <button onClick={onClose} className="btn-ghost flex-1">
                  Close
                </button>
              </div>
            </div>
          )}

          {/* ================= Step 2: payment ================= */}
          {step === 'payment' && booking && (
            <PaymentForm
              booking={booking}
              secondsLeft={heldSeconds}
              onPaid={handlePaid}
              onExpired={handleExpired}
              onClose={onClose}
            />
          )}

          {/* ================= Step 1: details ================= */}
          {step === 'details' && (
            <>
              <div
                className="relative h-52 overflow-hidden bg-ink-800"
                style={event.imageUrl && !imageFailed ? undefined : PATTERN_BG}
              >
                {event.imageUrl && !imageFailed ? (
                  <img
                    src={event.imageUrl}
                    alt=""
                    onError={() => setImageFailed(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center pb-10">
                    <Ticket size={44} className="text-gold-400/70" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-transparent" />

                <div className="absolute bottom-4 left-6 right-6 text-left">
                  <span className="inline-block rounded-full bg-gradient-to-b from-gold-400 to-gold-500 px-3 py-1 text-xs font-bold text-ink-950">
                    {formatPrice(event.price)} / ticket
                  </span>
                  <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-stone-50">
                    {event.title}
                  </h2>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-ink-800/10 bg-white p-3 dark:border-gold-500/15 dark:bg-ink-900/50">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-gold-400 dark:bg-gold-500/15">
                      <CalendarDays size={17} />
                    </span>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-semibold">{formatDate(event.eventDate)}</p>
                      <p className="muted text-xs">{formatTime(event.eventDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-ink-800/10 bg-white p-3 dark:border-gold-500/15 dark:bg-ink-900/50">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-gold-400 dark:bg-gold-500/15">
                      <MapPin size={17} />
                    </span>
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-semibold">Location</p>
                      <p className="muted truncate text-xs">{event.location}</p>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <p className="muted mt-4 text-left text-sm leading-relaxed">{event.description}</p>
                )}

                <div className="mt-5 flex items-center justify-between rounded-2xl border border-ink-800/10 bg-white p-4 dark:border-gold-500/20 dark:bg-ink-900/50">
                  <div className="text-left">
                    <p className="text-sm font-semibold">Tickets</p>
                    <p className="muted text-xs">
                      {event.availableSeats} seat{event.availableSeats === 1 ? '' : 's'} left · max{' '}
                      {MAX_PER_BOOKING} per booking
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSeats((s) => Math.max(1, s - 1))}
                      disabled={seats <= 1}
                      aria-label="Fewer tickets"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold-500/50 text-gold-700 transition hover:bg-gold-500/15 disabled:opacity-30 dark:text-gold-400"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-7 text-center text-xl font-semibold">{seats}</span>
                    <button
                      onClick={() => setSeats((s) => Math.min(maxSeats, s + 1))}
                      disabled={seats >= maxSeats}
                      aria-label="More tickets"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold-500/50 text-gold-700 transition hover:bg-gold-500/15 disabled:opacity-30 dark:text-gold-400"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-5 space-y-2 border-t border-dashed border-ink-800/20 pt-4 dark:border-gold-500/25">
                  <div className="muted flex items-center justify-between text-sm">
                    <span>
                      {seats} × {formatPrice(event.price)}
                    </span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-semibold uppercase tracking-wider">Total</span>
                    <span className="gold-text font-display text-4xl font-semibold leading-none">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                {error && (
                  <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}

                {user ? (
                  <>
                    <button
                      onClick={handleContinue}
                      disabled={submitting}
                      className="btn-gold mt-5 w-full !py-3"
                    >
                      {submitting
                        ? 'Reserving seats...'
                        : isFree
                          ? 'Confirm reservation'
                          : 'Continue to payment'}
                    </button>
                    {!isFree && (
                      <p className="muted mt-2 text-center text-xs">
                        Your seats are held for a few minutes while you pay.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="mt-5">
                    <p className="muted mb-3 text-center text-sm">
                      Please sign in to reserve your tickets.
                    </p>
                    <button onClick={goToSignIn} className="btn-gold w-full !py-3">
                      Sign in to book
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Portal>
  );
}