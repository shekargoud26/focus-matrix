import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, QuadrantId, QUADRANTS } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Trash2, GripVertical, Edit2, X, Star, ArrowRightLeft } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';

interface Props {
  key?: string;
  task: Task;
  isOverlay?: boolean;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, title: string, desc: string) => void;
  onToggleStar?: (id: string) => void;
  onMoveToQuadrant?: (id: string, quadrantId: QuadrantId) => void;
}

const quadrantColors: Record<QuadrantId, string> = {
  q1: 'border-l-q1 bg-q1/10',
  q2: 'border-l-q2 bg-q2/10',
  q3: 'border-l-q3 bg-q3/10',
  q4: 'border-l-q4 bg-q4/10',
  inbox: 'border-l-slate-400 bg-slate-100 dark:bg-slate-800/80',
};

const quadrantRingColors: Record<QuadrantId, string> = {
  q1: 'focus-visible:ring-q1/50',
  q2: 'focus-visible:ring-q2/50',
  q3: 'focus-visible:ring-q3/50',
  q4: 'focus-visible:ring-q4/50',
  inbox: 'focus-visible:ring-slate-400/50',
};

export default function TaskTicket({ task, isOverlay, onToggle, onDelete, onEdit, onToggleStar, onMoveToQuadrant }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');
  const titleInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editTitle.trim() && onEdit) {
      onEdit(task.id, editTitle.trim(), editDesc.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(task.title);
      setEditDesc(task.description || '');
    }
  };

  if (isEditing) {
    return (
      <div className={cn(
        "bg-white dark:bg-slate-800 border-l-4 rounded-r-xl shadow-lg ring-1 ring-slate-200/50 dark:ring-slate-700/50 p-3 z-10 relative transition-all duration-200",
        quadrantColors[task.quadrantId]
      )}>
        <input
          ref={titleInputRef}
          className="w-full bg-transparent border-0 text-sm font-semibold focus:outline-none focus:ring-0 px-1 py-1 mb-1 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Task title"
        />
        <textarea
          className="w-full bg-transparent border-0 text-xs resize-y focus:outline-none focus:ring-0 px-1 py-1 mb-3 min-h-[100px] placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-600 dark:text-slate-400"
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Description (GitHub Flavored Markdown supported)"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!editTitle.trim()}
            className="px-3 py-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-slate-100"
          >
            Save Task
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={() => {
        if (!isOverlay && !task.completed) setIsEditing(true);
      }}
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
            "font-semibold text-sm leading-tight truncate transition-all duration-300 flex items-center gap-1.5",
            task.completed && "line-through text-slate-400 opacity-60"
          )}>
            {task.starred && <Star size={14} className="fill-amber-400 text-amber-400 shrink-0" />}
            <span className="truncate">{task.title}</span>
          </h4>
          {task.description && (
            <div className="text-[11px] text-slate-500 dark:text-slate-300 mt-2 leading-relaxed prose prose-slate dark:prose-invert max-w-none prose-sm prose-p:my-1 prose-headings:my-1 prose-ul:my-1 prose-li:my-0 prose-pre:p-2 prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900 break-words">
              <Markdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  input: ({ node, ...props }) => (
                    <input {...props} className="mr-1.5 mt-0.5 align-middle accent-slate-500" />
                  ),
                  li: ({ node, className, ...props }) => (
                    <li className={cn(className, className?.includes('task-list-item') && "flex items-start list-none ml-0")} {...props} />
                  )
                }}
              >
                {task.description
                  .replace(/^[-*]?\s*\[\s*\]\s+/gm, '- [ ] ')
                  .replace(/^[-*]?\s*\[[xX]\]\s+/gm, '- [x] ')
                }
              </Markdown>
            </div>
          )}
        </div>

        {!isOverlay && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 pointer-events-auto shrink-0">
            {!task.completed && (
              <>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStar?.(task.id);
                  }}
                  className={cn(
                    "p-1 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50",
                    task.starred 
                      ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20" 
                      : "text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  )}
                  title={task.starred ? "Unstar" : "Star"}
                >
                  <Star size={16} className={task.starred ? "fill-current" : ""} />
                </button>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                  title="Edit"
                >
                  <Edit2 size={16} />
                </button>
                {onMoveToQuadrant && (
                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                        title="Move"
                      >
                        <ArrowRightLeft size={16} />
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content
                        align="end"
                        sideOffset={4}
                        onPointerDownOutside={(e) => e.stopPropagation()}
                        className="z-[60] w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl ring-1 ring-slate-200/50 dark:ring-slate-700/50 p-1 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-200"
                      >
                        <div className="px-2 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          Move to
                        </div>
                        {QUADRANTS.map(q => (
                           <button
                             key={q.id}
                             onClick={(e) => {
                               e.stopPropagation();
                               onMoveToQuadrant(task.id, q.id);
                             }}
                             className={cn(
                               "text-left px-2 py-1.5 text-xs font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors focus:outline-none",
                               task.quadrantId === q.id ? "bg-slate-50 dark:bg-slate-800/80 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-300"
                             )}
                           >
                             {q.title}
                           </button>
                        ))}
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                )}
              </>
            )}
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
