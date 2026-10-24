import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/api';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md animate-fade-up flex-col py-10">
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl font-semibold">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {mode === 'login'
            ? 'Sign in to view your tickets and book events.'
            : 'Join Tixora to book premium events.'}
        </p>
      </div>

      <div className="card p-6 sm:p-8">
        {/* Mode tabs */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-ink-900">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`rounded-lg py-2 text-sm font-medium capitalize transition ${
                mode === m
                  ? 'bg-white shadow-sm dark:bg-ink-700'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {m === 'login' ? 'Sign in' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div className="relative">
              <UserIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                className="input !pl-10"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
              />
            </div>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="email"
              className="input !pl-10"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="password"
              className="input !pl-10"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'register' ? 6 : undefined}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-gold w-full">
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}