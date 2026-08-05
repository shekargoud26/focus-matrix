import React, { useState, useMemo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface DatePickerProps {
  date: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
  children?: React.ReactNode;
}

export default function DatePicker({ date, onChange, onClose, children }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date(date.getFullYear(), date.getMonth(), 1));

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = currentMonth.getDay();

  const days = useMemo(() => {
    const daysArray = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }
    return daysArray;
  }, [currentMonth, daysInMonth, firstDayOfMonth]);

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleSelect = (d: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    const newDate = new Date(date);
    newDate.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    onChange(newDate);
    onClose();
  };

  return (
    <Popover.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Popover.Anchor asChild>
        {children || <div className="absolute" />}
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={4}
          onInteractOutside={onClose}
          className="z-[60] w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 animate-in fade-in zoom-in-95 duration-200 focus:outline-none"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1 text-center">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              if (!d) return <div key={`empty-${i}`} className="w-7 h-7" />;
              
              const isSelected = d.toDateString() === date.toDateString();
              const isToday = d.toDateString() === new Date().toDateString();

              return (
                <button
                  key={d.toISOString()}
                  onClick={(e) => handleSelect(d, e)}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center text-xs rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                    isSelected
                      ? "bg-blue-600 text-white font-bold"
                      : isToday
                      ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
