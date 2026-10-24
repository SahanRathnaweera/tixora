import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { CalendarPlus, LogOut, Menu, Moon, ScanLine, Sun, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';


const linkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-gold-500/15 text-gold-700 dark:text-gold-300'
      : 'text-ink-800/70 hover:text-ink-800 dark:text-stone-300/80 dark:hover:text-white'
  }`;

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);
  const handleLogout = () => {
    logout();
    close();
    navigate('/');
  };

  const links = (
    <>
      <NavLink to="/" end className={linkClass} onClick={close}>
        Events
      </NavLink>
      {user && (
        <NavLink to="/dashboard" className={linkClass} onClick={close}>
          My Tickets
        </NavLink>
      )}
      {user?.role === 'ADMIN' && (
        <NavLink to="/admin/events" className={linkClass} onClick={close}>
          <CalendarPlus size={15} />
          Manage events
        </NavLink>
      )}
      {user?.role === 'ADMIN' && (
        <NavLink to="/admin" className={linkClass} onClick={close}>
          <ScanLine size={15} />
          Verify
        </NavLink>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-ink-800/10 bg-cream-50/80 backdrop-blur-xl transition-colors duration-300 dark:border-gold-500/15 dark:bg-ink-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3" onClick={close}>
          <Logo className="h-10 w-10" />
          <span className="font-display text-2xl font-semibold uppercase tracking-[0.25em]">
            Tixora
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden items-center gap-1 md:flex">{links}</nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-800/15 text-ink-800/70 transition hover:bg-ink-800/5 dark:border-gold-500/25 dark:text-stone-300 dark:hover:bg-gold-500/10"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              <div className="hidden items-center gap-3 rounded-xl border border-ink-800/15 py-1 pl-1 pr-3 dark:border-gold-500/25 sm:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-gold-400 to-gold-500 text-xs font-bold text-ink-950">
                  {initials(user.name)}
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700 dark:text-gold-400">
                    {user.role}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                aria-label="Log out"
                className="hidden h-10 w-10 items-center justify-center rounded-xl border border-ink-800/15 text-ink-800/70 transition hover:bg-ink-800/5 dark:border-gold-500/25 dark:text-stone-300 dark:hover:bg-gold-500/10 sm:flex"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-gold !py-2">
              Sign in
            </Link>
          )}

          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-800/15 md:hidden dark:border-gold-500/25"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="animate-fade-up border-t border-ink-800/10 px-4 py-4 dark:border-gold-500/15 md:hidden">
          <nav className="flex flex-col gap-1">{links}</nav>
          {user && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-ink-800/15 p-3 dark:border-gold-500/25">
              <div>
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gold-700 dark:text-gold-400">
                  {user.role}
                </p>
              </div>
              <button onClick={handleLogout} className="btn-ghost !py-2">
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}