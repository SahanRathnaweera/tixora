import { useState } from 'react';
import { CalendarDays, MapPin, Ticket } from 'lucide-react';
import { formatDate, formatPrice, formatTime } from '../lib/format';
import type { EventItem } from '../types';

interface Props {
  event: EventItem;
  onSelect: (event: EventItem) => void;
}

export default function EventCard({ event, onSelect }: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  const soldOut = event.availableSeats === 0;
  const lowSeats = !soldOut && event.availableSeats <= event.totalSeats * 0.2;
  const soldPct = Math.round(((event.totalSeats - event.availableSeats) / event.totalSeats) * 100);

  const date = new Date(event.eventDate);
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'short' }).toUpperCase();

  return (
    <article className="card group flex h-full flex-col overflow-hidden hover:-translate-y-1.5 hover:border-gold-500/50 hover:shadow-[0_24px_50px_-24px_rgba(201,164,92,0.5)]">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        {event.imageUrl && !imageFailed ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-600 via-ink-700 to-ink-900"
            style={{
              backgroundImage:
                'radial-gradient(rgba(201,164,92,0.18) 1px, transparent 1px), linear-gradient(135deg, #1A5547, #0B3027 55%, #08211A)',
              backgroundSize: '18px 18px, 100% 100%',
            }}
          >
            <Ticket size={46} className="text-gold-400/80" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" />

        {/* Date badge */}
        <div className="absolute left-4 top-4 flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-cream-50/95 text-ink-800 shadow-lg backdrop-blur">
          <span className="text-lg font-bold leading-none">{day}</span>
          <span className="mt-0.5 text-[10px] font-bold tracking-wider text-gold-700">{month}</span>
        </div>

        {/* Price */}
        <span className="absolute right-4 top-4 rounded-full bg-gradient-to-b from-gold-400 to-gold-500 px-3.5 py-1 text-sm font-bold text-ink-950 shadow-lg">
          {formatPrice(event.price)}
        </span>

        {/* Status */}
        {soldOut && (
          <span className="absolute bottom-3 left-4 rounded-md bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
            Sold out
          </span>
        )}
        {lowSeats && (
          <span className="absolute bottom-3 left-4 rounded-md bg-amber-400 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-950">
            Few seats left
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-semibold leading-snug">{event.title}</h3>

        <ul className="muted mt-3 space-y-1.5 text-sm">
          <li className="flex items-center gap-2">
            <CalendarDays size={15} className="shrink-0 text-gold-600 dark:text-gold-400" />
            {formatDate(event.eventDate)} · {formatTime(event.eventDate)}
          </li>
          <li className="flex items-center gap-2">
            <MapPin size={15} className="shrink-0 text-gold-600 dark:text-gold-400" />
            <span className="line-clamp-1">{event.location}</span>
          </li>
        </ul>

        <div className="mt-auto pt-5">
          <div className="muted mb-1.5 flex justify-between text-xs">
            <span>{soldOut ? 'No seats left' : `${event.availableSeats} seats left`}</span>
            <span>{soldPct}% booked</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-800/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300 transition-all duration-700"
              style={{ width: `${soldPct}%` }}
            />
          </div>

          <button
            onClick={() => onSelect(event)}
            disabled={soldOut}
            className="btn-gold mt-4 w-full"
          >
            {soldOut ? 'Sold out' : 'Book now'}
          </button>
        </div>
      </div>
    </article>
  );
}