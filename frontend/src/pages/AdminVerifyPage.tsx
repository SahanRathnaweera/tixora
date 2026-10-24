import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, ClipboardPaste, QrCode, ScanLine, XCircle } from 'lucide-react';
import { getErrorMessage, ticketApi } from '../lib/api';
import { formatDateTime } from '../lib/format';
import type { VerifyResult } from '../types';

type Outcome = { ok: true; data: VerifyResult } | { ok: false; message: string };

interface HistoryItem {
  id: number;
  code: string;
  ok: boolean;
  message: string;
  at: number;
}

const CORNER = 'absolute h-8 w-8 border-gold-400';

export default function AdminVerifyPage() {
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    const value = code.trim();
    if (!value || scanning) return;

    setScanning(true);
    setOutcome(null);

    // Run the API call and a short "scanning" animation together
    const [result] = await Promise.all([
      ticketApi
        .verify(value)
        .then((data): Outcome => ({ ok: true, data }))
        .catch((err): Outcome => ({ ok: false, message: getErrorMessage(err) })),
      new Promise((resolve) => setTimeout(resolve, 900)),
    ]);

    setOutcome(result);
    setHistory((prev) =>
      [
        {
          id: Date.now(),
          code: value,
          ok: result.ok,
          message: result.ok ? `${result.data.holderName} · ${result.data.eventTitle}` : result.message,
          at: Date.now(),
        },
        ...prev,
      ].slice(0, 8),
    );
    setScanning(false);
    setCode('');
    inputRef.current?.focus();
  };

  const pasteFromClipboard = async () => {
    try {
      setCode(await navigator.clipboard.readText());
    } catch {
      /* clipboard permission denied */
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-600 dark:text-gold-400">
          Staff only
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">Ticket verification</h1>
        <div className="mt-3 h-0.5 w-16 rounded-full bg-gradient-to-r from-gold-500 to-transparent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ---------- Scanner ---------- */}
        <section className="card p-6">
          <div
            className="relative mx-auto aspect-square w-full max-w-xs overflow-hidden rounded-3xl border border-gold-500/30"
            style={{
              backgroundImage:
                'radial-gradient(rgba(201,164,92,0.15) 1px, transparent 1px), linear-gradient(135deg, #0B3027, #05140F)',
              backgroundSize: '16px 16px, 100% 100%',
            }}
          >
            <span className={`${CORNER} left-4 top-4 rounded-tl-xl border-l-2 border-t-2`} />
            <span className={`${CORNER} right-4 top-4 rounded-tr-xl border-r-2 border-t-2`} />
            <span className={`${CORNER} bottom-4 left-4 rounded-bl-xl border-b-2 border-l-2`} />
            <span className={`${CORNER} bottom-4 right-4 rounded-br-xl border-b-2 border-r-2`} />

            <div className="flex h-full flex-col items-center justify-center gap-3">
              <QrCode
                size={64}
                className={`text-gold-400 transition ${scanning ? 'opacity-90' : 'opacity-40'}`}
              />
              <p className="text-xs uppercase tracking-[0.2em] text-stone-300/70">
                {scanning ? 'Verifying...' : 'Ready to scan'}
              </p>
            </div>

            {scanning && (
              <div
                className="scan-line absolute left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent"
                style={{ boxShadow: '0 0 14px #C9A45C' }}
              />
            )}
          </div>

          <form onSubmit={handleVerify} className="mt-6 space-y-3">
            <label className="text-sm font-medium" htmlFor="qr-input">
              Ticket code
            </label>
            <div className="flex gap-2">
              <input
                id="qr-input"
                ref={inputRef}
                className="input font-mono"
                placeholder="TIXORA-xxxxxxxx-xxxx-..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                autoComplete="off"
              />
              <button
                type="button"
                onClick={pasteFromClipboard}
                aria-label="Paste"
                className="btn-ghost shrink-0 !px-3"
              >
                <ClipboardPaste size={16} />
              </button>
            </div>
            <button type="submit" disabled={scanning || !code.trim()} className="btn-gold w-full !py-3">
              <ScanLine size={16} />
              {scanning ? 'Scanning...' : 'Simulate scan'}
            </button>
            <p className="muted text-xs leading-relaxed">
              Paste the <span className="font-mono">TIXORA-...</span> code from a customer&apos;s
              ticket. A hardware QR scanner works too: it types the code and presses Enter for you.
            </p>
          </form>
        </section>

        {/* ---------- Result + history ---------- */}
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">Result</h2>

            {!outcome ? (
              <div className="muted py-10 text-center text-sm">
                <ScanLine size={34} className="mx-auto mb-3 opacity-50" />
                Scan a ticket to see the result here.
              </div>
            ) : outcome.ok ? (
              <div className="animate-fade-up rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={36} className="shrink-0 text-emerald-500" />
                  <div>
                    <p className="font-display text-xl font-semibold text-emerald-700 dark:text-emerald-400">
                      Ticket verified
                    </p>
                    <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80">
                      Entry allowed
                    </p>
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="muted text-[10px] font-semibold uppercase tracking-wider">Guest</dt>
                    <dd className="font-semibold">{outcome.data.holderName}</dd>
                  </div>
                  <div>
                    <dt className="muted text-[10px] font-semibold uppercase tracking-wider">Seats</dt>
                    <dd className="font-semibold">{outcome.data.bookedSeats}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="muted text-[10px] font-semibold uppercase tracking-wider">Event</dt>
                    <dd className="font-semibold">{outcome.data.eventTitle}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="muted text-[10px] font-semibold uppercase tracking-wider">
                      Verified at
                    </dt>
                    <dd className="font-semibold">{formatDateTime(outcome.data.verifiedAt)}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="animate-fade-up rounded-2xl border border-red-500/40 bg-red-500/10 p-5">
                <div className="flex items-center gap-3">
                  <XCircle size={36} className="shrink-0 text-red-500" />
                  <div>
                    <p className="font-display text-xl font-semibold text-red-600 dark:text-red-400">
                      Entry denied
                    </p>
                    <p className="text-sm text-red-600/90 dark:text-red-300/90">{outcome.message}</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider">Recent scans</h2>
            {history.length === 0 ? (
              <p className="muted text-sm">No scans yet in this session.</p>
            ) : (
              <ul className="divide-y divide-ink-800/10 dark:divide-gold-500/15">
                {history.map((h) => (
                  <li key={h.id} className="flex items-start gap-3 py-3">
                    {h.ok ? (
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{h.message}</p>
                      <p className="muted truncate font-mono text-[11px]">{h.code}</p>
                    </div>
                    <span className="muted shrink-0 text-xs">
                      {new Date(h.at).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}