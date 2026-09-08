import React, { useState, useEffect, useMemo } from 'react';import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  TouchSensor,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { QuadrantId, QUADRANTS } from './types';
import Quadrant from './components/Quadrant';
import TaskTicket from './components/TaskTicket';
import ArchiveDrawer from './components/ArchiveDrawer';
import InboxDrawer from './components/InboxDrawer';
import InboxContent from './components/InboxContent';
import { Routes, Route, Link } from 'react-router-dom';
import ProfilePage from './pages/ProfilePage';
import AuthModal from './components/AuthModal';
import { AuthProvider, useAuth, SESSION_EXPIRED_EVENT } from './lib/auth';
import { useTasks } from './lib/useTasks';
import { useProfile } from './lib/useProfile';
import { Moon, Sun, Archive, Grid2X2, Inbox, User, LogIn, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

function MatrixApp() {
  const { user, mode, logout } = useAuth();
  const {
    tasks,
    loading: tasksLoading,
    addTask,
    toggleTask,
    toggleStar,
    moveToQuadrant,
    editTask,
    updateTaskDate,
    deleteTask,
    moveLocal,
    reorderLocal,
    commitDrag,
    importTasks,
  } = useTasks(mode);
  const { profile, updateProfile } = useProfile(mode);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Expired session → drop to guest + prompt login (US-5).
  useEffect(() => {
    const onExpired = () => setIsAuthOpen(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('focus-matrix-theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [zenModeQuadrant, setZenModeQuadrant] = useState<QuadrantId | null>(null);

  useEffect(() => {
    localStorage.setItem('focus-matrix-theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [isDarkMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeTasks = useMemo(() => {
    return [...tasks]
      .filter(t => !t.completed)
      .sort((a, b) => {
        if (a.starred && !b.starred) return -1;
        if (!a.starred && b.starred) return 1;
        return 0;
      });
  }, [tasks]);
  const archivedTasks = useMemo(() => tasks.filter(t => t.completed).sort((a, b) => b.createdAt - a.createdAt), [tasks]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const overId = over.id as string;
    const activeTask = tasks.find(t => t.id === active.id);

    if (!activeTask) return;

    const isOverAQuadrant = QUADRANTS.some(q => q.id === overId) || overId === 'inbox';

    if (isOverAQuadrant && activeTask.quadrantId !== overId) {
      moveLocal(activeTask.id, overId as QuadrantId);
      return;
    }

    const overTask = tasks.find(t => t.id === overId);
    if (overTask && activeTask.quadrantId !== overTask.quadrantId) {
      moveLocal(activeTask.id, overTask.quadrantId);
      reorderLocal(activeTask.id, overTask.id);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderLocal(active.id as string, over.id as string);
    }

    setActiveId(null);
    // Flush any drag-time local moves (quadrant + positions) to the server.
    // No-op in guest mode (already persisted via localStorage).
    commitDrag().catch((e) => console.warn('drag sync failed', e));
  }

  return (
    <div className="h-screen flex flex-col bg-app-bg text-app-text transition-colors duration-500 overflow-hidden">
      {/* Decroative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-q1/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[35%] h-[35%] bg-q2/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] bg-q3/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 2xl:px-8 py-2 md:py-3 transition-all duration-300">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 mb-2 pb-2 border-b border-card-border shrink-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-md">
              <div className="flex items-center justify-center">
                <Grid2X2 strokeWidth={2.5} size={22} className="text-slate-800 dark:text-slate-100" />
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-app-text">
                Focus Matrix
              </h1>
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-2"
          >
            <button
              onClick={() => setIsInboxOpen(true)}
              className="2xl:hidden flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <Inbox size={16} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
              <span className="text-sm font-semibold hidden sm:inline">Inbox</span>
              {activeTasks.filter(t => t.quadrantId === 'inbox').length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                  {activeTasks.filter(t => t.quadrantId === 'inbox').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsArchiveOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <Archive size={16} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
              <span className="text-sm font-semibold hidden sm:inline">Archive</span>
              {archivedTasks.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                  {archivedTasks.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun size={20} className="text-amber-400" />
              ) : (
                <Moon size={20} className="text-slate-600" />
              )}
            </button>
            <Link
              to="/profile"
              className="p-2 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 overflow-hidden flex items-center justify-center"
              aria-label="Profile"
            >
              {user ? (
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-600 text-white text-[11px] font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User size={20} className="text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              )}
            </Link>
            {user ? (
              <button
                onClick={() => logout()}
                className="p-2 rounded-full bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                aria-label="Log out"
              >
                <LogOut size={20} className="text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
              </button>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              >
                <LogIn size={16} />
                <span className="text-sm font-semibold hidden sm:inline">Log in</span>
              </button>
            )}
            {mode === 'authed' && tasksLoading && (
              <span className="hidden sm:inline px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Syncing…
              </span>
            )}
          </motion.div>
        </header>

        {/* Main Routes */}
        <Routes>
          <Route path="/" element={
            <>
              {/* Matrix Grid & Sidebar */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="flex-1 flex overflow-hidden min-h-0 gap-6 w-full pb-10 md:pb-0">
                  {/* Matrix Grid */}
                  <main className="relative flex-1 min-h-0 overflow-y-auto md:overflow-hidden min-w-0">
                    <div className={cn(
                      "grid gap-4 h-full transition-all duration-500",
                      zenModeQuadrant 
                        ? "grid-cols-1 grid-rows-1" 
                        : "grid-cols-1 md:grid-cols-2 md:grid-rows-2"
                    )}>
                      <AnimatePresence mode="popLayout">
                        {QUADRANTS.filter(q => !zenModeQuadrant || q.id === zenModeQuadrant).map((q, idx) => (
                          <motion.div
                            layout
                            key={q.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.4, delay: 0.05 * idx, layout: { type: "spring", bounce: 0.2, duration: 0.6 } }}
                            className="flex flex-col h-[350px] md:h-auto min-h-0"
                          >
                            <Quadrant
                              quadrant={q}
                              tasks={activeTasks.filter(t => t.quadrantId === q.id)}
                              onAddTask={addTask}
                              onToggle={toggleTask}
                              onDelete={deleteTask}
                              onEdit={editTask}
                              onToggleStar={toggleStar}
                              onMoveToQuadrant={moveToQuadrant}
                              isZenMode={zenModeQuadrant === q.id}
                              onToggleZenMode={() => setZenModeQuadrant(prev => prev === q.id ? null : q.id)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </main>

                  {/* Persistent 2xl Sidebar */}
                  <AnimatePresence>
                    {!zenModeQuadrant && (
                      <motion.aside 
                        initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                        animate={{ opacity: 1, width: 320, marginLeft: 24 }}
                        exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="hidden 2xl:flex shrink-0 flex-col overflow-hidden"
                      >
                        <div className="w-80 h-full">
                          <InboxContent 
                            tasks={activeTasks.filter(t => t.quadrantId === 'inbox')}
                            onAddTask={addTask}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            onEdit={editTask}
                            onToggleStar={toggleStar}
                            onMoveToQuadrant={moveToQuadrant}
                          />
                        </div>
                      </motion.aside>
                    )}
                  </AnimatePresence>
                </div>

                <DragOverlay dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: { active: { opacity: '0.4' } },
                  }),
                }}>
                  {activeId ? (
                    <TaskTicket
                      task={tasks.find(t => t.id === activeId)!}
                      isOverlay
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </>
          } />
          
          <Route path="/profile" element={<ProfilePage tasks={tasks} profile={profile} onUpdateProfile={updateProfile} onUpdateTaskDate={updateTaskDate} onImportTasks={importTasks} />} />
        </Routes>
      </div>

      <AuthModal open={isAuthOpen} onOpenChange={setIsAuthOpen} />

      <InboxDrawer
        isOpen={isInboxOpen}
        onClose={() => setIsInboxOpen(false)}
        tasks={activeTasks.filter(t => t.quadrantId === 'inbox')}
        onAddTask={addTask}
        onToggle={toggleTask}
        onDelete={deleteTask}
        onEdit={editTask}
        onToggleStar={toggleStar}
        onMoveToQuadrant={moveToQuadrant}
      />

      <ArchiveDrawer
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        tasks={archivedTasks}
        onDelete={deleteTask}
        onRestore={toggleTask}
        onUpdateTaskDate={updateTaskDate}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MatrixApp />
    </AuthProvider>
  );
}
