import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import InboxContent from './InboxContent';
import { Task, QuadrantId } from '../types';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onAddTask: (quadrantId: QuadrantId, title: string, desc: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string, title: string, desc: string) => void;
  onToggleStar?: (id: string) => void;
  onMoveToQuadrant?: (id: string, quadrantId: QuadrantId) => void;
}

export default function InboxDrawer({ isOpen, onClose, tasks, onAddTask, onToggle, onDelete, onEdit, onToggleStar, onMoveToQuadrant }: Props) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed top-0 right-0 h-full w-full max-w-sm bg-app-bg shadow-2xl z-50 flex flex-col focus:outline-none transition-transform">
           <div className="flex-1 overflow-hidden">
             <InboxContent 
                tasks={tasks}
                onAddTask={onAddTask}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                onToggleStar={onToggleStar}
                onMoveToQuadrant={onMoveToQuadrant}
                onClose={onClose}
             />
           </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
