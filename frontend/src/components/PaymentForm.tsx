import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Clock, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { useCountdown } from '../hooks/useCountdown';
import { bookingApi, getErrorMessage } from '../lib/api';
import { formatPrice } from '../lib/format';
import type { Booking, PaymentInput } from '../types';

interface Props {
  booking: Booking;
  /** Seconds left of the seat hold when this form is shown. */
  secondsLeft: number;
  onPaid: (booking: Booking) => void;
  onExpired?: () => void;
  onClose: () => void;
}

const TEST_CARDS = [
  { label: 'Approved', number: '4242 4242 4242 4242' },
  { label: 'Declined', number: '4000 0000 0000 0002' },
  { label: 'No funds', number: '4000 0000 0000 9995' },
];

const digitsOnly = (v: string) => v.replace(/\D/g, '');
const formatCard = (v: string) =>
  digitsOnly(v)
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();
const formatExpiry = (v: string) => {
  const d = digitsOnly(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

type PayResult = { ok: true; booking: Booking } | { ok: false; error: unknown };

export default function PaymentForm({ booking, secondsLeft, onPaid, onExpired, onClose }: Props) {
  const left = useCountdown(secondsLeft);
  const expired = left === 0;

  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tell the parent once when the hold runs out
  const notified = useRef(false);
  useEffect(() => {
    if (expired && !notified.current) {
      notified.current = true;
      onExpired?.();
    }
  }, [expired, onExpired]);

  const fillTestCard = (number: string) => {
    setCardNumber(number);
    if (!cardHolder) setCardHolder('Demo User');
    if (!expiry) setExpiry('12/30');
    if (!cvv) setCvv('123');
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (processing || expired) return;
    setError(null);

    const cardDigits = digitsOnly(cardNumber);
    if (cardDigits.length < 13) {
      setError('Enter a valid card number.');
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
      setError('Expiry must be in MM/YY format.');
      return;
    }
    if (cvv.length < 3) {
      setError('Enter the 3 or 4 digit security code.');
      return;
    }

    const payload: PaymentInput = {
      cardHolder: cardHolder.trim(),
      cardNumber: cardDigits,
      expiry,
      cvv,
    };

    setProcessing(true);
    // Run the request together with a short "processing" pause so the demo feels real
    const [result] = await Promise.all([
      bookingApi
        .pay(booking.id, payload)
        .then((b): PayResult => ({ ok: true, booking: b }))
        .catch((err: unknown): PayResult => ({ ok: false, error: err })),
      new Promise<void>((resolve) => setTimeout(resolve, 1200)),
    ]);
    setProcessing(false);

    if (result.ok) onPaid(result.booking);
    else setError(getErrorMessage(result.error));
  };

  if (expired) {
    return (
      <div className="p-6 text-center sm:p-8">
        <Clock size={44} className="mx-auto text-amber-500" />
        <h3 className="mt-4 font-display text-2xl font-semibold">Reservation expired</h3>
        <p className="muted mt-2 text-sm">
          Your seats were released because the payment was not completed in time. Please book
          again.
        </p>
        <button onClick={onClose} className="btn-gold mt-6">
          Close
        </button>
      </div>
    );
  }

  const urgent = left !== null && left <= 60;

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="text-left">
          <h3 className="font-display text-2xl font-semibold">Payment</h3>
          <p className="muted mt-1 text-sm">
            {booking.bookedSeats} seat{booking.bookedSeats > 1 ? 's' : ''} · {booking.eventTitle}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold tabular-nums ${
            urgent
              ? 'bg-red-500/15 text-red-600 dark:text-red-400'
              : 'bg-gold-500/15 text-gold-700 dark:text-gold-300'
          }`}
        >
          <Clock size={14} />
          {mmss(left ?? 0)}
        </span>
      </div>
      <p className="muted mt-1 text-left text-xs">Your seats are held until the timer ends.</p>

      <div className="mt-4 flex items-end justify-between rounded-2xl border border-ink-800/10 bg-white p-4 dark:border-gold-500/20 dark:bg-ink-900/50">
        <span className="text-sm font-semibold uppercase tracking-wider">Total</span>
        <span className="gold-text font-display text-3xl font-semibold leading-none">
          {formatPrice(booking.totalPrice)}
        </span>
      </div>

      {/* Demo test cards */}
      <div className="mt-4 rounded-xl border border-dashed border-gold-500/40 p-3 text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-700 dark:text-gold-400">
          Demo checkout: no real payment
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TEST_CARDS.map((c) => (
            <button
              key={c.number}
              type="button"
              onClick={() => fillTestCard(c.number)}
              className="rounded-full border border-gold-500/40 px-3 py-1 text-xs font-medium transition hover:bg-gold-500/15"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-left">
        <input
          className="input"
          placeholder="Cardholder name"
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value)}
          required
          maxLength={100}
          autoComplete="off"
        />

        <div className="relative">
          <CreditCard size={16} className="absolute left-3.5 top-3.5 text-ink-800/40 dark:text-stone-400/60" />
          <input
            className="input !pl-10 font-mono"
            placeholder="Card number"
            value={cardNumber}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCardNumber(formatCard(e.target.value))}
            required
            inputMode="numeric"
            autoComplete="off"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            className="input font-mono"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setExpiry(formatExpiry(e.target.value))}
            required
            inputMode="numeric"
            autoComplete="off"
          />
          <input
            className="input font-mono"
            placeholder="CVV"
            type="password"
            value={cvv}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setCvv(digitsOnly(e.target.value).slice(0, 4))}
            required
            inputMode="numeric"
            autoComplete="off"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <button type="submit" disabled={processing} className="btn-gold w-full !py-3">
          <Lock size={16} />
          {processing ? 'Processing payment...' : `Pay ${formatPrice(booking.totalPrice)}`}
        </button>

        <p className="muted flex items-center justify-center gap-1.5 text-center text-xs">
          <ShieldCheck size={13} />
          Simulated payment. Card details are never stored.
        </p>
      </form>
    </div>
  );
}