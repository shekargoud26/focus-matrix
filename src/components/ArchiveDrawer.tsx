import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Task, QUADRANTS } from '../types';
import { X, RotateCcw, Trash2, Archive, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import DatePicker from './DatePicker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onUpdateTaskDate?: (id: string, newDate: number) => void;
}

const quadrantTextColors: Record<string, string> = {
  q1: 'text-q1',
  q2: 'text-q2',
  q3: 'text-q3',
  q4: 'text-q4',
};

export default function ArchiveDrawer({ isOpen, onClose, tasks, onDelete, onRestore, onUpdateTaskDate }: Props) {
  const [editingDateId, setEditingDateId] = React.useState<string | null>(null);

  const groupedTasks = tasks.reduce((acc, task) => {
    const date = new Date(task.closedAt || task.createdAt);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const dateStr = isToday ? 'Today' : date.toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed top-0 right-0 h-full w-full max-w-sm bg-app-bg shadow-2xl z-50 p-6 flex flex-col focus:outline-none transition-transform">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <Archive size={20} className="text-slate-400" />
              <Dialog.Title className="text-xl font-bold tracking-tight">Archive</Dialog.Title>
            </div>
            <Dialog.Close className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
              <X size={20} />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Archive size={48} className="text-slate-200 dark:text-slate-800 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Your archive is empty.<br/>Completed tasks will appear here.
                  </p>
                </div>
              ) : (
                Object.entries(groupedTasks).map(([dateLabel, dailyTasks]) => (
                  <motion.div layout key={dateLabel} className="mb-6 space-y-3">
                    <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest sticky top-0 bg-app-bg/95 backdrop-blur-sm py-2 z-10">
                      {dateLabel}
                    </h3>
                    {dailyTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex justify-between items-center group"
                      >
                        <div className="min-w-0 pr-4">
                          <h4 className="text-sm font-medium line-through text-slate-400 dark:text-slate-500 truncate">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                              "text-[9px] uppercase font-bold tracking-widest",
                              quadrantTextColors[task.quadrantId] || "text-slate-400"
                            )}>
                              {task.quadrantId === 'inbox' ? 'Inbox' : QUADRANTS.find(q => q.id === task.quadrantId)?.title}
                            </span>
                            <span className="text-[9px] text-slate-300 dark:text-slate-600 font-medium">
                              {new Date(task.closedAt || task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {editingDateId === task.id ? (
                            <DatePicker
                              date={new Date(task.closedAt || task.createdAt)}
                              onClose={() => setEditingDateId(null)}
                              onChange={(newDate) => {
                                if (onUpdateTaskDate) {
                                  const oldD = new Date(task.closedAt || task.createdAt);
                                  newDate.setHours(oldD.getHours(), oldD.getMinutes(), oldD.getSeconds());
                                  onUpdateTaskDate(task.id, newDate.getTime());
                                }
                              }}
                            >
                              <button
                                className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                                title="Editing Date"
                              >
                                <CalendarIcon size={16} />
                              </button>
                            </DatePicker>
                          ) : (
                            <button
                              onClick={() => setEditingDateId(task.id)}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                              title="Edit Completed Date"
                            >
                              <CalendarIcon size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => onRestore(task.id)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                            title="Restore"
                          >
                            <RotateCcw size={16} />
                          </button>
                          <button
                            onClick={() => onDelete(task.id)}
                            className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg text-rose-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                            title="Delete permanently"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
             <p className="text-[10px] text-slate-400 font-medium">
               A well-organized archive leads to a well-organized mind.
             </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
