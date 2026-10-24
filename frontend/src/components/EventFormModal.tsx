import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { ImagePlus, Trash2, X } from 'lucide-react';
import { eventApi, getErrorMessage, uploadApi } from '../lib/api';
import type { EventInput, EventItem } from '../types';

interface Props {
  event: EventItem | null; // null = create a new event
  onClose: () => void;
  onSaved: (message: string) => void;
}

const MAX_IMAGE_MB = 5;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

export default function EventFormModal({ event, onClose, onSaved }: Props) {
  const isEdit = event !== null;
  const booked = event ? event.totalSeats - event.availableSeats : 0;

  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [eventDate, setEventDate] = useState(event ? event.eventDate.slice(0, 16) : '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [price, setPrice] = useState(event ? String(event.price) : '');
  const [totalSeats, setTotalSeats] = useState(event ? String(event.totalSeats) : '');
  const [imageUrl, setImageUrl] = useState(event?.imageUrl ?? '');
  const [previewFailed, setPreviewFailed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
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

  const changeImage = (url: string) => {
    setImageUrl(url);
    setPreviewFailed(false);
  };

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, WEBP or GIF).');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_IMAGE_MB} MB.`);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      changeImage(await uploadApi.image(file));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceNum = Number(price);
    const seatsNum = Number(totalSeats);
    const minSeats = Math.max(1, booked);

    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError('Enter a valid price (0 or more).');
      return;
    }
    if (!Number.isInteger(seatsNum) || seatsNum < minSeats) {
      setError(
        isEdit && booked > 0
          ? `Total seats cannot be less than the ${booked} seat(s) already booked.`
          : 'Total seats must be at least 1.',
      );
      return;
    }

    const payload: EventInput = {
      title: title.trim(),
      description: description.trim(),
      eventDate: eventDate.length === 16 ? `${eventDate}:00` : eventDate,
      location: location.trim(),
      price: priceNum,
      totalSeats: seatsNum,
      imageUrl: imageUrl.trim(),
    };

    setSubmitting(true);
    try {
      if (isEdit && event) await eventApi.update(event.id, payload);
      else await eventApi.create(payload);
      onSaved(isEdit ? 'Event updated.' : 'Event created.');
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const showPreview = imageUrl && !previewFailed;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/70 p-0 backdrop-blur-md sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[94vh] w-full max-w-2xl animate-fade-up overflow-y-auto rounded-t-3xl border border-ink-800/10 bg-cream-50 p-6 shadow-2xl sm:rounded-3xl sm:p-8 dark:border-gold-500/25 dark:bg-ink-800"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ink-800/10 transition hover:bg-ink-800/20 dark:bg-white/10 dark:hover:bg-white/20"
        >
          <X size={18} />
        </button>

        <h2 className="font-display text-3xl font-semibold">
          {isEdit ? 'Edit event' : 'Create event'}
        </h2>
        <p className="muted mt-1 text-sm">
          {isEdit ? 'Update the details and image of this event.' : 'Add a new event for guests to book.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* ---------- Image ---------- */}
          <div>
            <span className="mb-1.5 block text-left text-sm font-medium">Event image</span>
            <div className="relative aspect-[16/7] overflow-hidden rounded-2xl border border-dashed border-gold-500/50 bg-ink-800/5 dark:bg-black/20">
              {showPreview ? (
                <img
                  src={imageUrl}
                  alt="Event preview"
                  onError={() => setPreviewFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="muted flex h-full flex-col items-center justify-center gap-2 text-sm">
                  <ImagePlus size={30} className="text-gold-500" />
                  {previewFailed ? 'Image could not be loaded' : 'No image selected'}
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-ink-950/60 backdrop-blur-sm">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-400 border-t-transparent" />
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-ghost !py-2"
              >
                <ImagePlus size={16} /> {imageUrl ? 'Change image' : 'Upload image'}
              </button>
              {imageUrl && (
                <button type="button" onClick={() => changeImage('')} className="btn-ghost !py-2">
                  <Trash2 size={16} /> Remove
                </button>
              )}
              <span className="muted text-xs">JPG, PNG, WEBP or GIF · max {MAX_IMAGE_MB} MB</span>
            </div>

            <input
              className="input mt-3"
              placeholder="...or paste an image URL (https://...)"
              value={imageUrl}
              onChange={(e) => changeImage(e.target.value)}
              maxLength={255}
            />
          </div>

          {/* ---------- Details ---------- */}
          <Field label="Title">
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </Field>

          <Field label="Description">
            <textarea
              className="input min-h-[96px] resize-y"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Date & time">
              <input
                type="datetime-local"
                className="input"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
              />
            </Field>
            <Field label="Location">
              <input
                className="input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                maxLength={200}
              />
            </Field>
            <Field label="Ticket price">
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </Field>
            <Field label={isEdit && booked > 0 ? `Total seats (${booked} already booked)` : 'Total seats'}>
              <input
                type="number"
                min={Math.max(1, booked)}
                step="1"
                className="input"
                value={totalSeats}
                onChange={(e) => setTotalSeats(e.target.value)}
                required
              />
            </Field>
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={submitting || uploading} className="btn-gold sm:min-w-40">
              {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}