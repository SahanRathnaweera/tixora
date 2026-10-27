import { useState } from 'react';
import { CalendarDays, Clock, Download, Lock, MapPin, Maximize2, XCircle } from 'lucide-react';
import { useCountdown } from '../hooks/useCountdown';
import { getErrorMessage } from '../lib/api';
import { formatDate, formatDateTime, formatPrice, formatTime } from '../lib/format';
import type { Booking } from '../types';

interface Props {
  booking: Booking;
  now: number;
  onCancel: (id: number) => Promise<void>;
  onZoom: (booking: Booking) => void;
  onPay: (booking: Booking) => void;
}

type Status = 'pending' | 'lapsed' | 'valid' | 'used' | 'expired' | 'cancelled';

const BADGE: Record<Status, { label: string; className: string }> = {
  pending: { label: 'Awaiting payment', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  lapsed: { label: 'Hold expired', className: 'bg-slate-500/15 text-slate-600 dark:text-slate-300' },
  valid: { label: 'Valid', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  used: { label: 'Used', className: 'bg-slate-500/15 text-slate-600 dark:text-slate-300' },
  expired: { label: 'Expired', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/15 text-red-600 dark:text-red-400' },
};

const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

function getStatus(b: Booking, now: number, left: number | null): Status {
  if (b.bookingStatus === 'CANCELLED') return 'cancelled';
  if (b.bookingStatus === 'PENDING_PAYMENT') return left === 0 ? 'lapsed' : 'pending';
  if (b.ticket?.verified) return 'used';
  if (new Date(b.eventDate).getTime() < now) return 'expired';
  return 'valid';
}

export default function TicketCard({ booking, now, onCancel, onZoom, onPay }: Props) {
  const left = useCountdown(booking.bookingStatus === 'PENDING_PAYMENT' ? booking.holdSecondsLeft : null);

  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = getStatus(booking, now, left);
  const badge = BADGE[status];
  const ticket = booking.ticket;
  const canCancel = status === 'valid' || status === 'pending';

  const handleCancel = async () => {
    setBusy(true);
    setError(null);
    try {
      await onCancel(booking.id);
      setConfirming(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // Short payment note under the figures
  let paymentNote: string | null = null;
  if (status === 'pending' && left !== null) {
    paymentNote = `Pay within ${mmss(left)} to keep your seats.`;
  } else if (status === 'lapsed') {
    paymentNote = 'The payment window closed and your seats were released.';
  } else if (booking.bookingStatus === 'CONFIRMED') {
    paymentNote = `Paid${booking.cardLast4 ? ` with card •••• ${booking.cardLast4}` : ''}${
      booking.paymentReference ? ` · ${booking.paymentReference}` : ''
    }`;
  } else if (booking.paymentStatus === 'REFUNDED') {
    paymentNote = 'Refunded (simulated).';
  }

  return (
    <article className="card overflow-hidden hover:border-gold-500/40 md:flex">
      {/* ---------- Left: details ---------- */}
      <div className="flex-1 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${badge.className}`}
          >
            {badge.label}
          </span>
          <span className="muted text-xs">Booking #{booking.id}</span>
        </div>

        <h3 className="mt-3 font-display text-2xl font-semibold leading-snug">
          {booking.eventTitle}
        </h3>

        <ul className="muted mt-3 space-y-1.5 text-sm">
          <li className="flex items-center gap-2">
            <CalendarDays size={15} className="shrink-0 text-gold-600 dark:text-gold-400" />
            {formatDate(booking.eventDate)} · {formatTime(booking.eventDate)}
          </li>
          <li className="flex items-center gap-2">
            <MapPin size={15} className="shrink-0 text-gold-600 dark:text-gold-400" />
            {booking.eventLocation}
          </li>
        </ul>

        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-dashed border-ink-800/15 pt-4 dark:border-gold-500/20">
          <div>
            <dt className="muted text-[10px] font-semibold uppercase tracking-wider">Seats</dt>
            <dd className="mt-0.5 font-semibold">{booking.bookedSeats}</dd>
          </div>
          <div>
            <dt className="muted text-[10px] font-semibold uppercase tracking-wider">Total</dt>
            <dd className="mt-0.5 font-semibold text-gold-700 dark:text-gold-400">
              {formatPrice(booking.totalPrice)}
            </dd>
          </div>
          <div>
            <dt className="muted text-[10px] font-semibold uppercase tracking-wider">Booked on</dt>
            <dd className="mt-0.5 text-sm font-semibold">{formatDate(booking.createdAt)}</dd>
          </div>
        </dl>

        {paymentNote && (
          <p
            className={`mt-4 flex items-center gap-2 text-sm ${
              status === 'pending'
                ? 'font-medium text-amber-700 dark:text-amber-400'
                : 'muted'
            }`}
          >
            {status === 'pending' && <Clock size={15} className="shrink-0" />}
            {paymentNote}
          </p>
        )}

        {/* Actions */}
        {status === 'pending' && !confirming && (
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => onPay(booking)} className="btn-gold !py-2">
              <Lock size={15} /> Pay now
            </button>
            <button onClick={() => setConfirming(true)} className="btn-ghost !py-2">
              <XCircle size={16} /> Release seats
            </button>
          </div>
        )}

        {status === 'valid' && !confirming && (
          <button onClick={() => setConfirming(true)} className="btn-ghost mt-5 !py-2">
            <XCircle size={16} /> Cancel booking
          </button>
        )}

        {canCancel && confirming && (
          <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
            <p className="flex-1 text-sm text-red-700 dark:text-red-300">
              {status === 'pending'
                ? 'Release these seats? You will not be charged.'
                : 'Cancel this booking? Your seats are released and the payment is refunded (simulated).'}
            </p>
            <button
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="btn-ghost !px-4 !py-1.5"
            >
              Keep
            </button>
            <button
              onClick={handleCancel}
              disabled={busy}
              className="inline-flex items-center rounded-xl bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {busy ? 'Working...' : status === 'pending' ? 'Yes, release' : 'Yes, cancel'}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      {/* ---------- Right: QR stub ---------- */}
      <div className="flex flex-col items-center justify-center gap-3 border-t border-dashed border-gold-500/40 bg-ink-800/[0.04] p-6 md:w-64 md:border-l md:border-t-0 dark:bg-black/20">
        {ticket ? (
          <>
            <button
              onClick={() => onZoom(booking)}
              aria-label="Enlarge QR code"
              className="group relative rounded-2xl bg-white p-2 shadow-md"
            >
              <img
                src={ticket.qrCodeImage}
                alt="Ticket QR code"
                className={`h-40 w-40 transition ${status === 'valid' ? '' : 'opacity-30 grayscale'}`}
              />
              {status === 'valid' && (
                <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-ink-950/60 opacity-0 transition group-hover:opacity-100">
                  <Maximize2 size={22} className="text-gold-300" />
                </span>
              )}
            </button>

            {status === 'used' && ticket.verifiedAt && (
              <p className="muted text-center text-xs">
                Scanned
                <br />
                {formatDateTime(ticket.verifiedAt)}
              </p>
            )}

            <p className="max-w-full break-all text-center font-mono text-[10px] text-ink-800/60 dark:text-stone-300/60">
              {ticket.qrCodeData}
            </p>

            {status === 'valid' && (
              <a
                href={ticket.qrCodeImage}
                download={`tixora-ticket-${booking.id}.png`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-700 hover:underline dark:text-gold-400"
              >
                <Download size={14} /> Download QR
              </a>
            )}
          </>
        ) : status === 'pending' || status === 'lapsed' ? (
          <div className="muted text-center text-sm">
            <Lock size={28} className="mx-auto mb-2 text-gold-500" />
            Your QR ticket is issued after payment.
          </div>
        ) : (
          <p className="muted text-sm">No ticket available</p>
        )}
      </div>
    </article>
  );
}