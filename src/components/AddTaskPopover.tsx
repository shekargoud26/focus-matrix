import React, { useState, useRef, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onAdd: (title: string, desc: string) => void;
  children: React.ReactNode;
  shortcutKey?: string;
}

export default function AddTaskPopover({ onAdd, children, shortcutKey }: Props) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!shortcutKey) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Use e.code to ignore layout-specific characters produced by Alt on macOS
      if (e.altKey && e.code === `Digit${shortcutKey}`) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [shortcutKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), desc.trim());
    setTitle('');
    setDesc('');
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (title.trim()) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        {children}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={8}
          className="z-50 w-72 bg-app-bg p-4 rounded-xl shadow-2xl border border-card-border outline-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  autoFocus
                  placeholder="Task title..."
                  className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 shadow-sm text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 px-3 py-2.5 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div>
                <textarea
                  placeholder="Description (optional)"
                  className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 shadow-sm text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 px-3 py-2.5 rounded-lg text-slate-500 dark:text-slate-300 resize-none placeholder:text-slate-400/60 transition-all"
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 shadow-sm"
                >
                  Add Task
                </button>
              </div>
            </form>
          </motion.div>
          <Popover.Arrow className="fill-white dark:fill-slate-900" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
