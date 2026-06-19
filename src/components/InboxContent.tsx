import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, QuadrantId } from '../types';
import TaskTicket from './TaskTicket';
import AddTaskPopover from './AddTaskPopover';
import { Inbox, Plus, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface Props {
  tasks: Task[];
  onAddTask: (quadrantId: QuadrantId, title: string, desc: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string, title: string, desc: string) => void;
  onToggleStar?: (id: string) => void;
  onMoveToQuadrant?: (id: string, quadrantId: QuadrantId) => void;
  onClose?: () => void;
}

export default function InboxContent({ tasks, onAddTask, onToggle, onDelete, onEdit, onToggleStar, onMoveToQuadrant, onClose }: Props) {
  const { setNodeRef } = useDroppable({ id: 'inbox' });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl md:rounded-none overflow-hidden transition-colors duration-300"
      )}
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800/80 sticky top-0 z-10 shrink-0">
        <div>
          <h3 className="font-bold text-base leading-tight flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <Inbox size={18} className="shrink-0 text-slate-500" />
            Global Inbox
            {tasks.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {tasks.length}
              </span>
            )}
          </h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-medium opacity-80 mt-1 block">
            Unassigned Tasks
          </span>
        </div>
        <div className="flex items-center gap-2">
          <AddTaskPopover 
            onAdd={(title, desc) => onAddTask('inbox', title, desc)}
          >
            <button className="p-1.5 shrink-0 bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/50">
               <Plus size={16} />
            </button>
          </AddTaskPopover>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/50 text-slate-500"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 min-h-[150px]">
        {tasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 pointer-events-none">
            <Inbox size={40} className="mb-3 text-slate-400" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Inbox is empty</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Capture ideas here quickly</p>
          </div>
        ) : (
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskTicket 
                  key={task.id} 
                  task={task} 
                  onToggle={onToggle} 
                  onDelete={onDelete} 
                  onEdit={onEdit} 
                  onToggleStar={onToggleStar} 
                  onMoveToQuadrant={onMoveToQuadrant}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}
