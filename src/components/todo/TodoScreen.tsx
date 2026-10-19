import React, { useState, useRef } from 'react';
import { useApp, getLocalDateString } from '../../context/AppContext';
import { QuickNotesModal } from './QuickNotesModal';
import { ThingsToBuyModal } from './ThingsToBuyModal';
import { ProductivityCalendarModal } from './ProductivityCalendarModal';
import { TaskCategory, Priority, TaskItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface SwipeableTaskCardProps {
  task: TaskItem;
  onToggle: (id: string) => void;
  onDelete: (task: TaskItem) => void;
  isRevealed: boolean;
  onReveal: (id: string | null) => void;
}

const SwipeableTaskCard: React.FC<SwipeableTaskCardProps> = ({
  task,
  onToggle,
  onDelete,
  isRevealed,
  onReveal,
}) => {
  const isChecked = task.completed;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        x: -120,
        height: 0,
        marginBottom: 0,
        overflow: 'hidden',
        transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
      }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-2xl group select-none"
    >
      {/* Background YouTube-style Red Delete Button */}
      <div className="absolute inset-y-0 right-0 w-[84px] bg-[#ff5c78] flex items-center justify-center rounded-r-2xl z-0">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onDelete(task);
          }}
          className="w-full h-full flex flex-col items-center justify-center text-[#070b12] active:scale-90 transition-transform"
          aria-label={`Delete ${task.title}`}
        >
          <span className="material-symbols-outlined text-[22px] font-bold">delete</span>
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider mt-0.5">
            Delete
          </span>
        </button>
      </div>

      {/* Foreground Draggable Task Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -84, right: 0 }}
        dragElastic={0.08}
        dragDirectionLock
        animate={{ x: isRevealed ? -84 : 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -36 || info.velocity.x < -250) {
            onReveal(task.id);
          } else {
            onReveal(null);
          }
        }}
        onClick={() => {
          if (isRevealed) {
            onReveal(null);
          }
        }}
        className={`relative z-10 flex items-start p-4 rounded-2xl transition-colors border ${
          isChecked
            ? 'bg-[#0c1320]/60 border-[#202c3d]/20 opacity-75'
            : 'bg-[#0c1320] border-[#202c3d]/40 hover:border-[#35d9ff]/30 shadow-sm'
        }`}
      >
        {/* Checkbox */}
        <div
          onClick={e => {
            e.stopPropagation();
            if (isRevealed) {
              onReveal(null);
              return;
            }
            onToggle(task.id);
          }}
          className="pt-0.5 mr-3.5 cursor-pointer shrink-0"
        >
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
              isChecked
                ? 'bg-[#35d9ff] text-[#003641] shadow-sm'
                : 'bg-[#162338] text-transparent hover:bg-[#1f314c]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] font-bold">check</span>
          </div>
        </div>

        {/* Task Title & Metadata */}
        <div
          onClick={() => {
            if (isRevealed) {
              onReveal(null);
              return;
            }
            onToggle(task.id);
          }}
          className="flex-1 min-w-0 cursor-pointer pr-1"
        >
          <p
            className={`text-[15px] font-medium leading-snug break-words transition-all ${
              isChecked ? 'line-through text-[#91a2b8]' : 'text-[#edf5ff]'
            }`}
          >
            {task.title}
          </p>

          <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-1 font-mono text-[11px]">
            {task.title.includes('Tuition Payment') ? (
              <span className="text-[#5cffb7] flex items-center font-semibold">
                <span className="material-symbols-outlined text-[13px] mr-1">payments</span>
                ৳5,000 received
              </span>
            ) : task.completed ? (
              <span className="text-[#5cffb7] flex items-center font-medium">
                <span className="material-symbols-outlined text-[13px] mr-1">check_circle</span>
                Completed {task.completedAt || 'today'}
              </span>
            ) : (
              <span className="text-[#35d9ff] flex items-center">
                <span className="material-symbols-outlined text-[13px] mr-1">schedule</span>
                {task.dueTime ? `Due ${task.dueTime}` : 'Due Today'}
              </span>
            )}
          </div>
        </div>

        {/* Visible Desktop/Mouse Delete Alternative */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onDelete(task);
          }}
          className="text-[#91a2b8] hover:text-[#ff5c78] p-1.5 ml-1 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-lg hover:bg-[#162338] shrink-0"
          title="Delete task"
          aria-label="Delete task"
        >
          <span className="material-symbols-outlined text-[16px]">delete</span>
        </button>
      </motion.div>
    </motion.div>
  );
};

export const TodoScreen: React.FC = () => {
  const {
    tasks,
    toggleTask,
    addTask,
    deleteTask,
    restoreTask,
    isProductivityCalendarOpen,
    setIsProductivityCalendarOpen,
  } = useApp();

  const todayStr = getLocalDateString();

  const [activeSegment, setActiveSegment] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showNewTaskPanel, setShowNewTaskPanel] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('Uni');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('High');
  const [newTaskDueTime, setNewTaskDueTime] = useState('11:59 PM');
  const [filterQuery, setFilterQuery] = useState('');

  // Swipe-to-delete state
  const [revealedTaskId, setRevealedTaskId] = useState<string | null>(null);
  const [deletedTaskNotice, setDeletedTaskNotice] = useState<TaskItem | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Daily task separation according to Section 7:
  // The Daily tab shows only tasks associated with the current local calendar date.
  // Historical tasks remain intact in data and are browsed in Productivity Calendar.
  const periodTasks = tasks.filter(t => {
    if (activeSegment === 'daily') {
      return t.period === 'daily' && (t.dueDate === todayStr || !t.dueDate);
    }
    return t.period === activeSegment;
  });

  const filteredTasks = periodTasks.filter(
    t =>
      t.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const completedCount = periodTasks.filter(t => t.completed).length;
  const totalCount = periodTasks.length;

  // Unfinished tasks from previous days
  const unfinishedPastTasks = tasks.filter(
    t => t.period === 'daily' && !t.completed && t.dueDate && t.dueDate < todayStr
  );

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle.trim(),
      completed: false,
      priority: newTaskPriority,
      category: newTaskCategory,
      dueDate: todayStr,
      dueTime: newTaskDueTime.trim() || undefined,
      period: activeSegment,
    });

    setNewTaskTitle('');
    setShowNewTaskPanel(false);
  };

  const handleDeleteTask = (task: TaskItem) => {
    deleteTask(task.id);
    setRevealedTaskId(null);

    // Show temporary Undo snackbar
    setDeletedTaskNotice(task);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setDeletedTaskNotice(null);
    }, 4500);
  };

  const handleUndoDelete = () => {
    if (deletedTaskNotice) {
      restoreTask(deletedTaskNotice);
      setDeletedTaskNotice(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  return (
    <main className="flex flex-col relative w-full px-4 pt-header-safe pb-28 bg-[#070b12] min-h-screen">
      <div className="flex flex-col w-full pb-4 space-y-6">
        {/* Segmented View Controller */}
        <div className="w-full bg-[#090f19] p-1.5 rounded-2xl flex items-center justify-between border border-[#202c3d]/40 shadow-inner font-mono text-xs">
          {(['daily', 'weekly', 'monthly'] as const).map(segment => (
            <button
              key={segment}
              type="button"
              onClick={() => {
                setActiveSegment(segment);
                setRevealedTaskId(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all duration-200 text-center font-medium capitalize ${
                activeSegment === segment
                  ? 'bg-[#35d9ff] text-[#003641] shadow-md font-bold'
                  : 'text-[#91a2b8] hover:text-[#edf5ff]'
              }`}
            >
              {segment}
            </button>
          ))}
        </div>

        {/* Section Header */}
        <div className="flex flex-col space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-baseline space-x-2">
              <h2 className="text-xl font-bold text-[#edf5ff] tracking-tight">
                {activeSegment === 'daily'
                  ? "Today's Focus"
                  : activeSegment === 'weekly'
                  ? 'Weekly Goals'
                  : 'Monthly Horizon'}
              </h2>

              <span className="text-[11px] font-mono text-[#91a2b8] font-normal tracking-tight">
                ({completedCount}/{totalCount} done)
              </span>
            </div>

            <button
              onClick={() => setShowNewTaskPanel(!showNewTaskPanel)}
              className="flex items-center space-x-1.5 text-[#35d9ff] hover:text-[#b5edff] transition-colors py-1.5 px-3 rounded-xl bg-[#0c1320] border border-[#202c3d]/40 active:scale-95 text-xs font-mono"
            >
              <span className="material-symbols-outlined text-[18px]">
                {showNewTaskPanel ? 'close' : 'add'}
              </span>
              <span>New Task</span>
            </button>
          </div>

          {/* Unfinished Past Tasks Notice (Carry Forward Banner) */}
          {activeSegment === 'daily' && unfinishedPastTasks.length > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c1320]/80 border border-[#facc15]/30 text-xs">
              <div className="flex items-center space-x-2 min-w-0 pr-2">
                <span className="material-symbols-outlined text-[#facc15] text-[16px] shrink-0">
                  history
                </span>
                <span className="text-[#edf5ff] truncate text-[11px]">
                  You have <span className="font-bold text-[#facc15]">{unfinishedPastTasks.length}</span> unfinished past task(s)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsProductivityCalendarOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-[#162338] hover:bg-[#1f314c] text-[#35d9ff] font-mono text-[10px] font-semibold border border-[#35d9ff]/30 shrink-0 active:scale-95 transition-all"
              >
                View History
              </button>
            </div>
          )}

          {/* Quick Task Panel (Toggleable) */}
          {showNewTaskPanel && (
            <form
              onSubmit={handleAddNewTask}
              className="bg-[#0c1320] p-4 rounded-2xl border border-[#35d9ff]/30 shadow-lg flex flex-col space-y-3"
            >
              <div className="flex items-center space-x-2 bg-[#090f19] px-3 py-2.5 rounded-xl border border-[#202c3d]/40">
                <span className="material-symbols-outlined text-[#91a2b8] text-[20px]">
                  edit_note
                </span>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="What do you need to get done?"
                  className="bg-transparent border-0 text-[#edf5ff] placeholder-[#91a2b8]/50 focus:outline-none w-full text-sm font-sans"
                />
              </div>

              {/* Action Buttons: Cancel and Add Task */}
              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewTaskPanel(false)}
                  className="px-3 py-1.5 text-[#91a2b8] hover:text-[#edf5ff] font-mono text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#35d9ff] text-[#003641] px-4 py-1.5 rounded-xl font-mono text-xs font-semibold active:scale-95 shadow-md hover:bg-[#b5edff] transition-colors"
                >
                  Add Task
                </button>
              </div>
            </form>
          )}

          {/* Task List Rows with Swipe-to-Delete Interaction */}
          <div className="flex flex-col space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#91a2b8] bg-[#0c1320] rounded-2xl border border-[#202c3d]/30">
                {activeSegment === 'daily'
                  ? 'No tasks logged for today. Tap "+ New Task" to begin your day.'
                  : 'No tasks logged for this timeframe. Tap "+ New Task" to schedule one.'}
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {filteredTasks.map(task => (
                  <SwipeableTaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onDelete={handleDeleteTask}
                    isRevealed={revealedTaskId === task.id}
                    onReveal={setRevealedTaskId}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Undo Snackbar on Task Delete */}
      <AnimatePresence>
        {deletedTaskNotice && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 inset-x-4 z-40 max-w-sm mx-auto bg-[#0c1320] border border-[#ff5c78]/40 shadow-2xl rounded-2xl p-3 flex items-center justify-between backdrop-blur-xl"
          >
            <div className="flex items-center space-x-2 min-w-0 pr-2">
              <span className="material-symbols-outlined text-[#ff5c78] text-[18px] shrink-0">
                delete
              </span>
              <span className="text-xs text-[#edf5ff] truncate">
                Deleted "{deletedTaskNotice.title}"
              </span>
            </div>
            <button
              type="button"
              onClick={handleUndoDelete}
              className="px-3 py-1 bg-[#35d9ff] text-[#003641] font-mono font-bold text-xs rounded-xl active:scale-95 transition-all shrink-0 shadow-md"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Circular Floating Productivity Calendar Action Button (Elevated per request) */}
      <div className="fixed right-5 bottom-28 sm:bottom-32 z-30">
        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsProductivityCalendarOpen(true)}
          aria-label="View daily history and productivity calendar"
          title="Daily History & Productivity Calendar"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#0c1320]/95 backdrop-blur-md text-[#35d9ff] border-2 border-[#35d9ff]/50 shadow-[0_6px_28px_rgba(0,0,0,0.65),0_0_20px_rgba(53,217,255,0.35)] hover:border-[#35d9ff] hover:shadow-[0_0_28px_rgba(53,217,255,0.6)] transition-all focus:outline-none"
        >
          <span className="material-symbols-outlined text-[26px] font-semibold transition-transform duration-200 group-hover:scale-110">
            calendar_month
          </span>
          {/* Subtle indicator beacon */}
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#35d9ff] opacity-40"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#35d9ff] border-2 border-[#070b12]"></span>
          </span>
        </motion.button>
      </div>

      {/* Productivity Calendar & Daily History Bottom Sheet */}
      <ProductivityCalendarModal
        isOpen={isProductivityCalendarOpen}
        onClose={() => setIsProductivityCalendarOpen(false)}
      />

      {/* Quick Notes Modal */}
      <QuickNotesModal />

      {/* Things to Buy Modal */}
      <ThingsToBuyModal />
    </main>
  );
};
