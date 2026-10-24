import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  CalendarX,
  MapPin,
  QrCode,
  RefreshCw,
  Search,
  Sparkles,
  Ticket,
} from 'lucide-react';
import BookingModal from '../components/BookingModal';
import CountUp from '../components/CountUp';
import EventCard from '../components/EventCard';
import Reveal from '../components/Reveal';
import { eventApi, getErrorMessage } from '../lib/api';
import { formatDate, formatPrice, formatTime } from '../lib/format';
import type { EventItem } from '../types';

type PriceFilter = 'all' | 'free' | 'under50' | '50to100' | 'over100';
type SortBy = 'date' | 'priceAsc' | 'priceDesc';

// Hero background photo (file is in frontend/public)
const HERO_IMAGE = '/main Home.jpg';

function matchesPrice(price: number, filter: PriceFilter): boolean {
  switch (filter) {
    case 'free':
      return price === 0;
    case 'under50':
      return price > 0 && price < 50;
    case '50to100':
      return price >= 50 && price <= 100;
    case 'over100':
      return price > 100;
    default:
      return true;
  }
}

const MARQUEE = [
  'Live music',
  'Gala dinners',
  'Stand-up comedy',
  'Cultural shows',
  'Tech summits',
  'Festivals',
  'Theatre nights',
];

const STEPS = [
  { icon: Search, title: 'Discover', text: 'Browse upcoming events and find your next experience.' },
  { icon: Ticket, title: 'Reserve', text: 'Choose your seats and confirm in a few seconds.' },
  { icon: QrCode, title: 'Walk in', text: 'Show your QR ticket. Staff verify it with a single scan.' },
];

/** Floating "next up" ticket shown in the hero. */
function HeroTicket({
  event,
  onBook,
}: {
  event: EventItem | null;
  onBook: (e: EventItem) => void;
}) {
  // Remember which image URL failed to load, so we can fall back to the placeholder
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const image = event?.imageUrl && failedUrl !== event.imageUrl ? event.imageUrl : null;

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute inset-0 animate-float-slow">
        <div className="h-full w-full -rotate-6 rounded-3xl border border-gold-500/20 bg-ink-600/30" />
      </div>
      <div className="absolute inset-0 animate-float" style={{ animationDelay: '-2s' }}>
        <div className="h-full w-full rotate-3 rounded-3xl border border-gold-500/25 bg-ink-700/40" />
      </div>

      <div
        className="relative animate-float-slow overflow-hidden rounded-3xl border border-gold-400/40 bg-gradient-to-br from-ink-700/95 to-ink-900/95 text-left shadow-2xl backdrop-blur-xl"
        style={{ animationDelay: '-4s' }}
      >
        {/* Image header */}
        <div className="relative h-40 overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={event?.title ?? ''}
              onError={() => event && setFailedUrl(event.imageUrl)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-600 via-ink-700 to-ink-900">
              <Ticket size={40} className="text-gold-400/70" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/20 to-transparent" />

          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-ink-950/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-gold-300 backdrop-blur">
            <span className="h-1.5 w-1.5 animate-glow rounded-full bg-gold-400" />
            Next up
          </span>
          <span className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/70 text-gold-400 backdrop-blur">
            <Ticket size={16} />
          </span>
        </div>

        {/* Details */}
        <div className="p-6 pt-3">
          {event ? (
            <>
              <h3 className="font-display text-2xl font-semibold leading-snug text-stone-50">
                {event.title}
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-stone-300/80">
                <li className="flex items-center gap-2">
                  <CalendarDays size={15} className="shrink-0 text-gold-400" />
                  {formatDate(event.eventDate)} · {formatTime(event.eventDate)}
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={15} className="shrink-0 text-gold-400" />
                  <span className="line-clamp-1">{event.location}</span>
                </li>
              </ul>
              <div className="my-5 border-t border-dashed border-gold-500/40" />
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-stone-400">From</p>
                  <p className="font-display text-3xl font-semibold text-gold-300">
                    {formatPrice(event.price)}
                  </p>
                </div>
                <button onClick={() => onBook(event)} className="btn-gold">
                  Book <ArrowRight size={15} />
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-display text-2xl font-semibold text-stone-50">
                New events coming soon
              </h3>
              <p className="mt-2 text-sm text-stone-300/80">
                Check back shortly for the next unforgettable night.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState('');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [availableOnly, setAvailableOnly] = useState(false);

  const [selected, setSelected] = useState<EventItem | null>(null);

  // Load upcoming events
  useEffect(() => {
    let active = true;
    eventApi
      .list()
      .then((data) => {
        if (!active) return;
        const now = Date.now();
        setEvents(data.filter((e) => new Date(e.eventDate).getTime() >= now));
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

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = events.filter(
      (e) =>
        (!q || e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q)) &&
        matchesPrice(e.price, priceFilter) &&
        (!availableOnly || e.availableSeats > 0),
    );
    list.sort((a, b) => {
      if (sortBy === 'priceAsc') return a.price - b.price;
      if (sortBy === 'priceDesc') return b.price - a.price;
      return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
    });
    return list;
  }, [events, search, priceFilter, sortBy, availableOnly]);

  const totalSeatsLeft = useMemo(
    () => events.reduce((sum, e) => sum + e.availableSeats, 0),
    [events],
  );

  // Soonest event that still has seats, shown on the hero ticket
  const nextEvent = useMemo(
    () =>
      events
        .filter((e) => e.availableSeats > 0)
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())[0] ??
      null,
    [events],
  );

  // Keep seat counts in sync after a booking (no reload needed)
  const handleBooked = (eventId: number, seats: number) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, availableSeats: Math.max(0, e.availableSeats - seats) } : e,
      ),
    );
  };

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div>
      {/* ================= Hero ================= */}
      <section className="relative overflow-hidden rounded-[2rem] border border-gold-500/25 bg-ink-900 px-6 py-14 shadow-2xl sm:px-12 lg:py-20">
        {/* Background photo (low opacity) */}
        <div
          className="pointer-events-none absolute inset-0 animate-kenburns bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
        />
        {/* Green overlays: keep the text readable, let the photo show on the right */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/95 via-ink-900/70 to-ink-800/30" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-ink-950/30" />

        {/* dotted pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(#C9A45C 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        {/* animated aurora glows */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-aurora rounded-full bg-gold-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 animate-aurora-slow rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Left: copy */}
          <div className="animate-fade-up text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/50 bg-ink-950/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-300">
              <Sparkles size={13} className="animate-glow" />
              Premium event reservations
            </span>

            <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.1] text-stone-50 sm:text-6xl">
              Unforgettable events,
              <br />
              <span className="animate-shimmer bg-gradient-to-r from-gold-400 via-gold-200 to-gold-400 bg-[length:200%_auto] bg-clip-text text-transparent">
                effortlessly booked.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base text-stone-300/80 lg:mx-0">
              Discover curated experiences, reserve your seats in seconds and walk in with a secure
              QR ticket.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <button onClick={() => scrollTo('events')} className="btn-gold !px-7 !py-3">
                Explore events <ArrowDown size={16} />
              </button>
              <button
                onClick={() => scrollTo('how')}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold-400/40 px-7 py-3 text-sm font-medium text-gold-200 transition hover:bg-gold-500/10"
              >
                How it works
              </button>
            </div>

            {/* stats */}
            <dl className="mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-gold-500/20 pt-8 text-center lg:text-left">
              <div>
                <dt className="font-display text-3xl font-semibold text-gold-300">
                  {loading ? '–' : <CountUp value={events.length} />}
                </dt>
                <dd className="mt-1 text-[11px] uppercase tracking-wider text-stone-300/70">
                  Upcoming events
                </dd>
              </div>
              <div>
                <dt className="font-display text-3xl font-semibold text-gold-300">
                  {loading ? '–' : <CountUp value={totalSeatsLeft} />}
                </dt>
                <dd className="mt-1 text-[11px] uppercase tracking-wider text-stone-300/70">
                  Seats available
                </dd>
              </div>
              <div>
                <dt className="font-display text-3xl font-semibold text-gold-300">QR</dt>
                <dd className="mt-1 text-[11px] uppercase tracking-wider text-stone-300/70">
                  Instant tickets
                </dd>
              </div>
            </dl>
          </div>

          {/* Right: floating ticket */}
          <div className="animate-fade-up" style={{ animationDelay: '200ms' }}>
            <HeroTicket event={loading ? null : nextEvent} onBook={setSelected} />
          </div>
        </div>
      </section>

      {/* ================= Marquee ================= */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-gold-500/20 bg-ink-800 py-4">
        <div className="flex w-max animate-marquee whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-10 pr-10 text-sm font-semibold uppercase tracking-[0.25em] text-gold-300"
            >
              {item}
              <Sparkles size={14} className="text-gold-500" />
            </span>
          ))}
        </div>
      </div>

      {/* ================= How it works ================= */}
      <section id="how" className="mt-20 scroll-mt-24">
        <Reveal className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600 dark:text-gold-400">
            Simple by design
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">How it works</h2>
          <div className="mx-auto mt-3 h-0.5 w-16 rounded-full bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
        </Reveal>

        <div className="relative grid gap-6 md:grid-cols-3">
          <div className="pointer-events-none absolute left-[17%] right-[17%] top-10 hidden border-t border-dashed border-gold-500/40 md:block" />
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 120}>
              <div className="card relative h-full p-6 text-center hover:-translate-y-1 hover:border-gold-500/50">
                <span className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-ink-800 text-gold-400 shadow-lg dark:bg-gold-500/15">
                  <Icon size={30} />
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-b from-gold-400 to-gold-500 text-xs font-bold text-ink-950">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold">{title}</h3>
                <p className="muted mt-2 text-sm">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= Events ================= */}
      <section id="events" className="mt-20 scroll-mt-24">
        <Reveal className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600 dark:text-gold-400">
            What&apos;s on
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Upcoming events</h2>
          <div className="mt-3 h-0.5 w-16 rounded-full bg-gradient-to-r from-gold-500 to-transparent" />
        </Reveal>

        {/* Search + filters */}
        <div className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-3.5 text-ink-800/40 dark:text-stone-400/60"
            />
            <input
              className="input !pl-10"
              placeholder="Search events or locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="input lg:w-44"
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as PriceFilter)}
            aria-label="Filter by price"
          >
            <option value="all">Any price</option>
            <option value="free">Free</option>
            <option value="under50">Under 50</option>
            <option value="50to100">50 - 100</option>
            <option value="over100">Over 100</option>
          </select>

          <select
            className="input lg:w-48"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            aria-label="Sort events"
          >
            <option value="date">Soonest first</option>
            <option value="priceAsc">Price: low to high</option>
            <option value="priceDesc">Price: high to low</option>
          </select>

          <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap px-1 text-sm">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="h-4 w-4 accent-[#c9a45c]"
            />
            Available only
          </label>
        </div>

        {!loading && !error && (
          <p className="muted mt-4 text-sm">
            {visible.length} event{visible.length === 1 ? '' : 's'} found
          </p>
        )}

        {/* Grid */}
        <div className="mt-6">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card h-[26rem] animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="card mx-auto max-w-md p-8 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button onClick={retry} className="btn-ghost mt-4">
                <RefreshCw size={16} /> Try again
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="muted py-16 text-center">
              <CalendarX size={40} className="mx-auto mb-3 opacity-60" />
              <p className="font-medium">No events match your search.</p>
              <p className="mt-1 text-sm">Try changing the filters.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((event, i) => (
                <Reveal key={event.id} delay={(i % 3) * 100}>
                  <EventCard event={event} onSelect={setSelected} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {selected && (
        <BookingModal event={selected} onClose={() => setSelected(null)} onBooked={handleBooked} />
      )}
    </div>
  );
}