import { ArrowRight, ArrowUp, Globe, Mail, MapPin, Phone, QrCode, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';


const linkClass = 'text-sm text-stone-300/70 transition hover:text-gold-300';

const BENEFITS = [
  { icon: Zap, text: 'Instant booking confirmation' },
  { icon: QrCode, text: 'Secure QR entry tickets' },
  { icon: ShieldCheck, text: 'Easy cancellation and refunds' },
];

export default function Footer() {
  const { user } = useAuth();
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="relative mt-24 overflow-hidden bg-ink-900 text-stone-300">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[36rem] -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* CTA band */}
        <div className="flex flex-col items-center justify-between gap-6 border-b border-gold-500/15 py-12 text-center md:flex-row md:text-left">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">
              Ready when you are
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-stone-50 sm:text-4xl">
              Your next unforgettable night starts here.
            </h2>
          </div>
          <Link to="/" onClick={scrollTop} className="btn-gold !px-7 !py-3">
            Browse events <ArrowRight size={16} />
          </Link>
        </div>

        {/* Columns */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" onClick={scrollTop} className="flex items-center gap-3">
              <Logo className="h-11 w-11" />
              <span className="font-display text-2xl font-semibold uppercase tracking-[0.2em] text-stone-50">
                Tixora
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-300/70">
              A premium way to discover events, reserve seats and walk in with a secure QR ticket.
            </p>
            <div className="mt-5 flex gap-2">
              {[Mail, Phone, Globe].map((Icon, i) => (
                <span
                  key={i}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold-500/25 text-gold-300 transition hover:bg-gold-500/15"
                >
                  <Icon size={16} />
                </span>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">Explore</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/" onClick={scrollTop} className={linkClass}>
                  All events
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className={linkClass}>
                  My tickets
                </Link>
              </li>
              {!user && (
                <li>
                  <Link to="/login" className={linkClass}>
                    Sign in / Register
                  </Link>
                </li>
              )}
              {user?.role === 'ADMIN' && (
                <>
                  <li>
                    <Link to="/admin/events" className={linkClass}>
                      Manage events
                    </Link>
                  </li>
                  <li>
                    <Link to="/admin" className={linkClass}>
                      Verify tickets
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Why Tixora */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
              Why Tixora
            </h3>
            <ul className="mt-4 space-y-3">
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-sm text-stone-300/70">
                  <Icon size={15} className="shrink-0 text-gold-400" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-stone-300/70">
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="shrink-0 text-gold-400" />
                support@tixora.com
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="shrink-0 text-gold-400" />
                +94 11 234 5678
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin size={15} className="shrink-0 text-gold-400" />
                Colombo, Sri Lanka
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-gold-500/15 py-6 text-xs text-stone-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Tixora. All rights reserved.</p>

          <button
            onClick={scrollTop}
            className="inline-flex items-center gap-2 rounded-lg border border-gold-500/25 px-3 py-1.5 text-gold-300 transition hover:bg-gold-500/15"
          >
            Back to top <ArrowUp size={13} />
          </button>
        </div>
      </div>
    </footer>
  );
}