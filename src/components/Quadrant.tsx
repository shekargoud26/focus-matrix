import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, QuadrantDef, QuadrantId } from '../types';
import TaskTicket from './TaskTicket';
import AddTaskPopover from './AddTaskPopover';
import { Plus, Zap, CalendarDays, Users, XCircle, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface Props {
  quadrant: QuadrantDef;
  tasks: Task[];
  onAddTask: (qId: QuadrantId, title: string, desc: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string, title: string, desc: string) => void;
  onToggleStar?: (id: string) => void;
  onMoveToQuadrant?: (id: string, quadrantId: QuadrantId) => void;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
}

const quadrantBackgrounds: Record<string, string> = {
  q1: 'bg-q1-bg',
  q2: 'bg-q2-bg',
  q3: 'bg-q3-bg',
  q4: 'bg-q4-bg',
};

const quadrantEmptyStates: Record<string, string> = {
  q1: 'Add tasks that are urgent and important to tackle immediately.',
  q2: 'Add tasks that require planning but aren\'t urgent.',
  q3: 'Add tasks that are urgent but can be done by someone else.',
  q4: 'Identify tasks that are neither urgent nor important to avoid.',
};

const quadrantHeaderColors: Record<string, string> = {
  q1: 'text-q1-text',
  q2: 'text-q2-text',
  q3: 'text-q3-text',
  q4: 'text-q4-text',
};

const quadrantBadgeStyles: Record<string, string> = {
  q1: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  q2: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  q3: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  q4: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
};

const QuadrantIcons: Record<string, React.ElementType> = {
  q1: Zap,
  q2: CalendarDays,
  q3: Users,
  q4: XCircle,
};

const quadrantRingColors: Record<string, string> = {
  q1: 'focus-visible:ring-q1/50',
  q2: 'focus-visible:ring-q2/50',
  q3: 'focus-visible:ring-q3/50',
  q4: 'focus-visible:ring-q4/50',
};

export default function Quadrant({ quadrant, tasks, onAddTask, onToggle, onDelete, onEdit, onToggleStar, onMoveToQuadrant, isZenMode, onToggleZenMode }: Props) {
  const { setNodeRef } = useDroppable({ id: quadrant.id });
  
  const Icon = QuadrantIcons[quadrant.id];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full backdrop-blur-md rounded-2xl shadow-sm border border-card-border overflow-hidden",
        quadrantBackgrounds[quadrant.id]
      )}
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/50">
        <div>
          <h3 className={cn("font-bold text-base leading-tight flex items-center gap-2", quadrantHeaderColors[quadrant.id])}>
            <Icon size={18} className="shrink-0" />
            {quadrant.title}
            {tasks.length > 0 && (
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", quadrantBadgeStyles[quadrant.id])}>
                {tasks.length}
              </span>
            )}
          </h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-300 uppercase tracking-widest font-medium opacity-80 mt-1 block">
            {quadrant.subtitle}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onToggleZenMode && (
            <button
              onClick={onToggleZenMode}
              title={isZenMode ? "Exit Zen Mode" : "Enter Zen Mode"}
              className={cn(
                "p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 focus:outline-none focus-visible:ring-2",
                quadrantRingColors[quadrant.id]
              )}
            >
              {isZenMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}
          <AddTaskPopover 
            onAdd={(title, desc) => onAddTask(quadrant.id, title, desc)}
            shortcutKey={quadrant.id.replace('q', '')}
          >
            <button 
              title={`Add task (Alt+${quadrant.id.replace('q', '')})`}
              className={cn(
                "p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-all duration-200 focus:outline-none focus-visible:ring-2",
                quadrantRingColors[quadrant.id]
              )}
            >
              <Plus size={18} />
            </button>
          </AddTaskPopover>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 overflow-y-auto min-h-[150px] scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskTicket key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} onToggleStar={onToggleStar} onMoveToQuadrant={onMoveToQuadrant} />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full min-h-[100px] flex flex-col items-center justify-center text-center p-6"
          >
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-3">
              <Plus className="text-slate-300 dark:text-slate-600" size={20} />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">
              {quadrantEmptyStates[quadrant.id]}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
