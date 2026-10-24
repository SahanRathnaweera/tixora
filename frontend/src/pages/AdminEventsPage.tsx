import { useEffect, useState } from 'react';
import { CalendarDays, ImageOff, MapPin, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import EventFormModal from '../components/EventFormModal';
import { eventApi, getErrorMessage } from '../lib/api';
import { formatDateTime, formatPrice } from '../lib/format';
import type { EventItem } from '../types';

function Thumb({ url, title }: { url: string | null; title: string }) {
  const [failed, setFailed] = useState(false);
  if (url && !failed) {
    return (
      <img
        src={url}
        alt={title}
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-600 to-ink-900">
      <ImageOff size={24} className="text-gold-400/70" />
    </div>
  );
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [form, setForm] = useState<{ event: EventItem | null } | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    eventApi
      .list()
      .then((data) => active && setEvents(data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const reload = () => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  };

  const handleSaved = (message: string) => {
    setNotice({ ok: true, text: message });
    reload();
  };

  const handleDelete = async (id: number) => {
    setBusyId(id);
    setNotice(null);
    try {
      await eventApi.remove(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setNotice({ ok: true, text: 'Event deleted.' });
    } catch (err) {
      setNotice({ ok: false, text: getErrorMessage(err) });
    } finally {
      setBusyId(null);
      setConfirmId(null);
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600 dark:text-gold-400">
            Staff only
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Manage events</h1>
          <div className="mt-3 h-0.5 w-16 rounded-full bg-gradient-to-r from-gold-500 to-transparent" />
        </div>
        <button onClick={() => setForm({ event: null })} className="btn-gold !py-3">
          <Plus size={16} /> New event
        </button>
      </div>

      {notice && (
        <p
          className={`mb-5 rounded-xl border px-4 py-2.5 text-sm ${
            notice.ok
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {notice.text}
        </p>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card h-32 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="card mx-auto max-w-md p-8 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={reload} className="btn-ghost mt-4">
            <RefreshCw size={16} /> Try again
          </button>
        </div>
      ) : events.length === 0 ? (
        <div className="muted py-16 text-center">
          <CalendarDays size={42} className="mx-auto mb-3 opacity-60" />
          <p className="font-medium">No events yet.</p>
          <button onClick={() => setForm({ event: null })} className="btn-gold mt-5">
            <Plus size={16} /> Create your first event
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((ev) => {
            const booked = ev.totalSeats - ev.availableSeats;
            const past = new Date(ev.eventDate).getTime() < now;
            const asking = confirmId === ev.id;

            return (
              <article key={ev.id} className="card flex flex-col overflow-hidden sm:flex-row">
                <div className="h-40 w-full shrink-0 sm:h-auto sm:w-48">
                  <Thumb url={ev.imageUrl} title={ev.title} />
                </div>

                <div className="flex flex-1 flex-col justify-between gap-4 p-5 lg:flex-row lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-semibold">{ev.title}</h3>
                      {past && (
                        <span className="rounded-full bg-slate-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Past
                        </span>
                      )}
                    </div>
                    <ul className="muted mt-2 space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CalendarDays size={14} className="text-gold-600 dark:text-gold-400" />
                        {formatDateTime(ev.eventDate)}
                      </li>
                      <li className="flex items-center gap-2">
                        <MapPin size={14} className="text-gold-600 dark:text-gold-400" />
                        {ev.location}
                      </li>
                    </ul>
                    <p className="mt-2 text-sm">
                      <span className="font-semibold text-gold-700 dark:text-gold-400">
                        {formatPrice(ev.price)}
                      </span>
                      <span className="muted">
                        {' '}
                        · {booked}/{ev.totalSeats} booked · {ev.availableSeats} left
                      </span>
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {asking ? (
                      <>
                        <span className="text-sm text-red-600 dark:text-red-400">Delete this event?</span>
                        <button
                          onClick={() => setConfirmId(null)}
                          disabled={busyId === ev.id}
                          className="btn-ghost !px-4 !py-1.5"
                        >
                          No
                        </button>
                        <button
                          onClick={() => handleDelete(ev.id)}
                          disabled={busyId === ev.id}
                          className="inline-flex items-center rounded-xl bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                        >
                          {busyId === ev.id ? 'Deleting...' : 'Yes, delete'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setForm({ event: ev })} className="btn-ghost !py-2">
                          <Pencil size={15} /> Edit
                        </button>
                        <button
                          onClick={() => setConfirmId(ev.id)}
                          aria-label="Delete event"
                          className="btn-ghost !px-3 !py-2 hover:!border-red-500/50 hover:!text-red-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {form && (
        <EventFormModal event={form.event} onClose={() => setForm(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}