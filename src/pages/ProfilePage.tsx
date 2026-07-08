import React, { useMemo, useState } from 'react';
import { Task, Profile } from '../types';
import { User, ArrowLeft, Edit2, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface Props {
  tasks: Task[];
  profile: Profile;
  onUpdateProfile: (profile: Profile) => void;
}

export default function ProfilePage({ tasks, profile, onUpdateProfile }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile.name);
  const [editTitle, setEditTitle] = useState(profile.title);

  const handleSave = () => {
    onUpdateProfile({
      name: editName,
      title: editTitle,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(profile.name);
    setEditTitle(profile.title);
    setIsEditing(false);
  };

  // Create heatmap data
  const { heatmapData, maxCount, totalCompleted } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Determine the start date (approx 52 weeks ago to fill a wide screen)
    const daysToTrack = 364; // 52 weeks * 7
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToTrack + 1);

    // Ensure startDate is a Sunday to align weeks
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek); // Shift to previous Sunday
    
    const finalDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const data = new Map<string, number>();
    let total = 0;

    tasks.forEach(task => {
      if (task.completed && task.closedAt) {
        total++;
        const date = new Date(task.closedAt);
        date.setHours(0, 0, 0, 0);
        if (date >= startDate) {
          const dateStr = date.toISOString().split('T')[0];
          data.set(dateStr, (data.get(dateStr) || 0) + 1);
        }
      }
    });

    let max = 0;
    const grid: { date: Date; count: number }[] = [];
    for (let i = 0; i < finalDays; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      const count = data.get(dateStr) || 0;
      if (count > max) max = count;
      grid.push({ date: current, count });
    }

    return { heatmapData: grid, maxCount: max, totalCompleted: total };
  }, [tasks]);

  const getColorClass = (count: number, max: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800';
    if (max === 0) return 'bg-slate-100 dark:bg-slate-800';
    
    const ratio = count / max;
    if (ratio <= 0.25) return 'bg-emerald-200 dark:bg-emerald-900/60';
    if (ratio <= 0.5) return 'bg-emerald-300 dark:bg-emerald-700/80';
    if (ratio <= 0.75) return 'bg-emerald-400 dark:bg-emerald-600';
    return 'bg-emerald-500 dark:bg-emerald-500';
  };

  // Group by weeks
  const weeks = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  return (
    <Tooltip.Provider delayDuration={100}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 w-full max-w-4xl mx-auto flex flex-col gap-8 pb-12"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 gap-6 relative">
          <div className="flex items-center gap-4 w-full">
            <Link 
              to="/"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 self-start sm:self-auto"
            >
              <ArrowLeft size={20} />
            </Link>
            
            <div className="flex gap-6 items-center flex-1">
              <div className="relative group">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md">
                  <User size={40} className="text-slate-500 dark:text-slate-400" />
                </div>
              </div>

              <div className="flex-1">
                {isEditing ? (
                  <div className="flex flex-col gap-3 max-w-sm">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full px-3 py-1.5 text-xl font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Your Title"
                      className="w-full px-3 py-1.5 text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-slate-300"
                    />
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={handleSave}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                      >
                        <Check size={14} />
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-md transition-colors"
                      >
                        <X size={14} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{profile.name}</h2>
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium">{profile.title}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="hidden sm:flex flex-col items-end shrink-0">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">{totalCompleted}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Tasks Completed</span>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
              title="Edit Profile"
            >
              <Edit2 size={18} />
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center justify-between">
            Activity Heatmap
            <span className="sm:hidden text-xs font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
              {totalCompleted} tasks
            </span>
          </h3>
          
          <div className="flex gap-1.5 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ direction: 'rtl' }}>
            <div className="flex gap-1.5" style={{ direction: 'ltr' }}>
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1.5">
                  {week.map((day, dIdx) => (
                    <Tooltip.Root key={dIdx}>
                      <Tooltip.Trigger asChild>
                        <div
                          className={cn(
                            "w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm transition-colors cursor-default hover:ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ring-slate-300 dark:ring-slate-600", 
                            getColorClass(day.count, maxCount)
                          )}
                        />
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content 
                          className="z-50 overflow-hidden rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-600 dark:text-slate-400 shadow-md animate-in fade-in zoom-in-95 duration-200"
                          sideOffset={5}
                        >
                          <span className="font-semibold text-slate-900 dark:text-white">{day.count} {day.count === 1 ? 'task' : 'tasks'}</span> completed on {day.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span>Less</span>
            <div className="w-3.5 h-3.5 rounded-sm bg-slate-100 dark:bg-slate-800" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-200 dark:bg-emerald-900/60" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-300 dark:bg-emerald-700/80" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-400 dark:bg-emerald-600" />
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-500" />
            <span>More</span>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
            Focus Matrix v1.0.0
          </p>
        </div>
      </motion.div>
    </Tooltip.Provider>
  );
}
