import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { LogIn, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApiError, api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function friendlyError(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    const body = e.body as { error?: string } | null;
    if (body?.error === 'email_taken') return 'That email is already registered. Try logging in.';
    if (body?.error === 'invalid_credentials') return 'Wrong email or password. Try again.';
    if (body?.error === 'invalid_input') return 'Please check the highlighted fields.';
    if (body?.error === 'signups_disabled') return 'New signups are disabled on this server.';
    if (body?.error === 'network_unreachable') {
      return 'Can’t reach the server — the API isn’t deployed yet. You can keep using Focus Matrix offline.';
    }
    if (body?.error === 'bad_response') {
      // Non-JSON reply: SPA fallback HTML (status 200) means the API really
      // isn't there; a 5xx means the server answered but errored.
      if (e.status >= 500) return 'Server hiccup — try again in a moment.';
      return 'Can’t reach the server — the API isn’t deployed yet. You can keep using Focus Matrix offline.';
    }
    if (body?.error === 'database_not_configured') {
      return 'Server is up but its database isn’t connected yet. Try again after setup.';
    }
    if (e.status >= 500) return 'Server hiccup — try again in a moment.';
  }
  return fallback;
}

const inputCls =
  'w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50';

export default function AuthModal({ open, onOpenChange }: Props) {
  const { login, signup } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // null = unknown (older backend / fetch failed) → assume open.
  const [signupsDisabled, setSignupsDisabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api
      .config()
      .then((cfg) => {
        if (cancelled) return;
        setSignupsDisabled(cfg.signupsDisabled);
        if (cfg.signupsDisabled) setTab('login');
      })
      .catch(() => {
        if (!cancelled) setSignupsDisabled(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const reset = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
    setBusy(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (tab === 'login') await login(email.trim(), password);
      else await signup(email.trim(), password, name.trim());
      reset();
      onOpenChange(false);
    } catch (e) {
      setError(friendlyError(e, 'Something went wrong. Try again.'));
      setBusy(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <AnimatePresence>
            {open && (
              <Dialog.Content asChild forceMount>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 outline-none"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Dialog.Title className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                        {tab === 'login' ? 'Welcome back' : 'Create your account'}
                      </Dialog.Title>
                      <Dialog.Description className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        {tab === 'login'
                          ? 'Log in to sync your matrix everywhere.'
                          : 'Sync your matrix across all your devices.'}
                      </Dialog.Description>
                    </div>
                    <Dialog.Close
                      aria-label="Close"
                      className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                    >
                      <X size={18} />
                    </Dialog.Close>
                  </div>

                  {signupsDisabled ? (
                    <p role="status" className="mb-4 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 text-center">
                      New signups are disabled on this server. Log in with your existing account.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1 p-1 mb-4 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {(['login', 'signup'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setTab(t);
                            setError(null);
                          }}
                          className={cn(
                            'px-3 py-1.5 rounded-md text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50',
                            tab === t
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
                          )}
                        >
                          {t === 'login' ? 'Log in' : 'Sign up'}
                        </button>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    {tab === 'signup' && (
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        autoComplete="name"
                        required
                        maxLength={80}
                        className={inputCls}
                      />
                    )}
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      type="email"
                      autoComplete="email"
                      required
                      className={inputCls}
                    />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tab === 'signup' ? 'Password (min 8 characters)' : 'Password'}
                      type="password"
                      autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                      required
                      minLength={8}
                      className={inputCls}
                    />
                    {error && (
                      <p role="alert" className="text-sm font-medium text-red-500">
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={busy}
                      className="mt-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                    >
                      {tab === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
                      {busy ? 'Please wait…' : tab === 'login' ? 'Log in' : 'Sign up'}
                    </button>
                  </form>

                  <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400 text-center">
                    Or keep using Focus Matrix offline — your tasks stay in this browser.
                  </p>
                </motion.div>
              </Dialog.Content>
            )}
          </AnimatePresence>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
