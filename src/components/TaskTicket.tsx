import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, QuadrantId } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Trash2, GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  key?: string;
  task: Task;
  isOverlay?: boolean;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const quadrantColors: Record<QuadrantId, string> = {
  q1: 'border-l-q1 bg-q1/10',
  q2: 'border-l-q2 bg-q2/10',
  q3: 'border-l-q3 bg-q3/10',
  q4: 'border-l-q4 bg-q4/10',
};

const quadrantRingColors: Record<QuadrantId, string> = {
  q1: 'focus-visible:ring-q1/50',
  q2: 'focus-visible:ring-q2/50',
  q3: 'focus-visible:ring-q3/50',
  q4: 'focus-visible:ring-q4/50',
};

export default function TaskTicket({ task, isOverlay, onToggle, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative bg-white dark:bg-slate-800/80 border-l-4 rounded-r-xl shadow-sm p-3 transition-all duration-200 cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
        quadrantColors[task.quadrantId],
        quadrantRingColors[task.quadrantId],
        isDragging && "opacity-30",
        isOverlay && "shadow-2xl scale-[1.02] rotate-1 z-50",
        !isOverlay && "hover:shadow-md hover:-translate-y-0.5"
      )}
    >
      <div className="flex items-start gap-2">
        <div
          className="mt-1 flex-shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-500 transition-colors"
        >
          <GripVertical size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "font-semibold text-sm leading-tight truncate transition-all duration-300",
            task.completed && "line-through text-slate-400 opacity-60"
          )}>
            {task.title}
          </h4>
          {task.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {!isOverlay && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 pointer-events-auto">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggle?.(task.id);
              }}
              className="p-1 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              title="Complete"
            >
              <CheckCircle2 size={16} />
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(task.id);
              }}
              className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Satisfying checkmark animation for completion */}
      <AnimatePresence>
        {task.completed && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            {/* This is just a visual hint, the item will move to archive anyway */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
