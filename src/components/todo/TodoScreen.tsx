import React, { useState, useRef, useEffect } from 'react';
import { useApp, getLocalDateString } from '../../context/AppContext';
import { QuickNotesModal } from './QuickNotesModal';
import { ThingsToBuyModal } from './ThingsToBuyModal';
import { ProductivityCalendarModal } from './ProductivityCalendarModal';
import { TaskItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../../utils/haptics';

interface TaskCardProps {
  task: TaskItem;
  onToggle: (id: string) => void;
  onOpenMenu: (task: TaskItem, anchorRect?: DOMRect) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onOpenMenu }) => {
  const isChecked = task.completed;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPressing, setIsPressing] = useState(false);

  // Clear timer helper
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    setIsPressing(true);

    timerRef.current = setTimeout(() => {
      triggerHaptic('selection');
      setIsPressing(false);
      const rect = cardRef.current?.getBoundingClientRect();
      onOpenMenu(task, rect);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);

    // Cancel long press if user is scrolling
    if (dx > 10 || dy > 10) {
      clearTimer();
    }
  };

  const handleTouchEnd = () => {
    clearTimer();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    triggerHaptic('light');
    const rect = cardRef.current?.getBoundingClientRect();
    onOpenMenu(task, rect);
  };

  return (
    <motion.div
      layout
      ref={cardRef}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        height: 0,
        marginBottom: 0,
        overflow: 'hidden',
        transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
      }}
      transition={{ duration: 0.2 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={handleContextMenu}
      className={`relative select-none flex items-start p-4 rounded-2xl transition-all border ${
        isPressing
          ? 'scale-[0.98] border-[#35d9ff] bg-[#162338] shadow-[0_0_16px_rgba(53,217,255,0.25)]'
          : isChecked
          ? 'bg-[#0c1320]/60 border-[#202c3d]/20 opacity-75'
          : 'bg-[#0c1320] border-[#202c3d]/40 hover:border-[#35d9ff]/30 shadow-sm'
      }`}
    >
      {/* Interactive Checkbox */}
      <div
        onClick={e => {
          e.stopPropagation();
          triggerHaptic('selection');
          onToggle(task.id);
        }}
        className="pt-0.5 mr-3.5 cursor-pointer shrink-0"
        aria-label={isChecked ? 'Mark task incomplete' : 'Mark task complete'}
      >
        <div
          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
            isChecked
              ? 'bg-[#35d9ff] text-[#003641] shadow-sm'
              : 'bg-[#162338] text-transparent hover:bg-[#1f314c] border border-[#202c3d]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px] font-bold">check</span>
        </div>
      </div>

      {/* Task Content */}
      <div
        onClick={() => {
          triggerHaptic('selection');
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

        {task.description && (
          <p className="text-xs text-[#91a2b8] mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-1 font-mono text-[11px]">
          {task.completed ? (
            <span className="text-[#5cffb7] flex items-center font-medium">
              <span className="material-symbols-outlined text-[13px] mr-1">check_circle</span>
              Done {task.completedAt ? (task.completedAt.includes('T') ? new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : task.completedAt) : 'today'}
            </span>
          ) : (
            <span className="text-[#35d9ff] flex items-center">
              <span className="material-symbols-outlined text-[13px] mr-1">schedule</span>
              {task.dueTime ? `Due ${task.dueTime}` : 'Due Today'}
            </span>
          )}
        </div>
      </div>

      {/* Desktop 3-Dot Action Button & Long-Press indicator */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          triggerHaptic('light');
          const rect = cardRef.current?.getBoundingClientRect();
          onOpenMenu(task, rect);
        }}
        className="text-[#91a2b8] hover:text-[#edf5ff] p-1.5 ml-1 opacity-70 hover:opacity-100 rounded-lg hover:bg-[#162338] shrink-0 transition-all active:scale-90"
        title="Task Actions (or press & hold on mobile)"
        aria-label="Open task actions"
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>
    </motion.div>
  );
};

export const TodoScreen: React.FC = () => {
  const {
    tasks,
    toggleTask,
    addTask,
    editTask,
    deleteTask,
    restoreTask,
    carryForwardTask,
    isProductivityCalendarOpen,
    setIsProductivityCalendarOpen,
  } = useApp();

  const todayStr = getLocalDateString();

  const [activeSegment, setActiveSegment] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showNewTaskPanel, setShowNewTaskPanel] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueTime, setNewTaskDueTime] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  // Contextual menu state
  const [contextTask, setContextTask] = useState<TaskItem | null>(null);

  // Edit task modal state
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDueTime, setEditDueTime] = useState('');

  // Delete & Undo state
  const [deletedTaskNotice, setDeletedTaskNotice] = useState<TaskItem | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Daily task separation:
  const periodTasks = tasks.filter(t => {
    if (activeSegment === 'daily') {
      return t.period === 'daily' && (t.dueDate === todayStr || !t.dueDate);
    }
    return t.period === activeSegment;
  });

  const filteredTasks = periodTasks.filter(
    t =>
      t.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(filterQuery.toLowerCase()))
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
      description: newTaskDescription.trim() || undefined,
      completed: false,
      priority: 'Medium',
      category: 'Personal',
      dueDate: todayStr,
      dueTime: newTaskDueTime.trim() || undefined,
      period: activeSegment,
    });

    triggerHaptic('success');
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskDueTime('');
    setShowNewTaskPanel(false);
  };

  const handleOpenEdit = (task: TaskItem) => {
    setContextTask(null);
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditDueDate(task.dueDate || todayStr);
    setEditDueTime(task.dueTime || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editTitle.trim()) return;

    editTask(editingTask.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      dueDate: editDueDate || todayStr,
      dueTime: editDueTime.trim() || undefined,
    });

    triggerHaptic('success');
    setEditingTask(null);
  };

  const handleDeleteTask = (task: TaskItem) => {
    deleteTask(task.id);
    setContextTask(null);
    triggerHaptic('warning');

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
      triggerHaptic('success');
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  const handleCarryForwardAction = (task: TaskItem) => {
    carryForwardTask(task.id);
    triggerHaptic('success');
    setContextTask(null);
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
                triggerHaptic('light');
                setActiveSegment(segment);
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

            {/* Top Action Buttons (Calendar Button + New Task Button) */}
            <div className="flex items-center space-x-2">
              {/* Top Calendar Icon Button (matching user marked placement) */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsProductivityCalendarOpen(true);
                }}
                className="w-8 h-8 rounded-xl bg-[#0c1320] border border-[#202c3d]/50 hover:border-[#35d9ff]/50 text-[#35d9ff] flex items-center justify-center transition-all active:scale-95 shadow-sm"
                title="Open Productivity Calendar"
                aria-label="Open Productivity Calendar"
              >
                <span className="material-symbols-outlined text-[19px]">calendar_month</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic('light');
                  setShowNewTaskPanel(!showNewTaskPanel);
                }}
                className="flex items-center space-x-1.5 text-[#35d9ff] hover:text-[#b5edff] transition-colors py-1.5 px-3 rounded-xl bg-[#0c1320] border border-[#202c3d]/40 active:scale-95 text-xs font-mono shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showNewTaskPanel ? 'close' : 'add'}
                </span>
                <span>New Task</span>
              </button>
            </div>
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
                onClick={() => {
                  triggerHaptic('light');
                  setIsProductivityCalendarOpen(true);
                }}
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

              <textarea
                rows={2}
                value={newTaskDescription}
                onChange={e => setNewTaskDescription(e.target.value)}
                placeholder="Optional notes or description..."
                className="bg-[#090f19] px-3 py-2 rounded-xl border border-[#202c3d]/40 text-xs text-[#edf5ff] placeholder-[#91a2b8]/40 focus:outline-none focus:border-[#35d9ff] resize-none font-sans"
              />

              <div className="flex flex-col space-y-1 font-mono text-xs">
                <label className="text-[10px] text-[#91a2b8]">DUE TIME (OPTIONAL)</label>
                <input
                  type="text"
                  placeholder="e.g. 7:00 PM or 11:59 PM"
                  value={newTaskDueTime}
                  onChange={e => setNewTaskDueTime(e.target.value)}
                  className="bg-[#090f19] border border-[#202c3d] rounded-xl px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
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

          {/* Task List Rows */}
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
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onOpenMenu={taskToOpen => setContextTask(taskToOpen)}
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

      {/* Long-Press Mobile Contextual Action Menu / Bottom Sheet */}
      <AnimatePresence>
        {contextTask && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setContextTask(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-sm bg-[#0c1320] border border-[#202c3d] rounded-3xl p-4 shadow-2xl flex flex-col space-y-3"
            >
              {/* Header preview of the task */}
              <div className="flex items-start justify-between pb-2.5 border-b border-[#202c3d]/40">
                <div className="min-w-0 pr-2">
                  <span className="font-mono text-[10px] text-[#35d9ff] uppercase font-semibold">
                    Task Actions
                  </span>
                  <h4 className="text-sm font-semibold text-[#edf5ff] truncate mt-0.5">
                    {contextTask.title}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setContextTask(null)}
                  className="w-7 h-7 rounded-full bg-[#162338] text-[#91a2b8] hover:text-[#edf5ff] flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col space-y-1 font-mono text-xs">
                {/* 1. Edit */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(contextTask)}
                  className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[#edf5ff] hover:bg-[#162338] transition-colors active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[#35d9ff] text-[18px]">edit</span>
                  <span>Edit Task</span>
                </button>

                {/* 2. Toggle Complete */}
                <button
                  type="button"
                  onClick={() => {
                    toggleTask(contextTask.id);
                    triggerHaptic('success');
                    setContextTask(null);
                  }}
                  className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[#edf5ff] hover:bg-[#162338] transition-colors active:scale-[0.98]"
                >
                  <span className={`material-symbols-outlined text-[18px] ${contextTask.completed ? 'text-[#facc15]' : 'text-[#5cffb7]'}`}>
                    {contextTask.completed ? 'undo' : 'check_circle'}
                  </span>
                  <span>{contextTask.completed ? 'Mark as Incomplete' : 'Mark as Completed'}</span>
                </button>

                {/* 3. Carry Forward (for any daily task) */}
                {contextTask.period === 'daily' && (
                  <button
                    type="button"
                    onClick={() => handleCarryForwardAction(contextTask)}
                    className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[#edf5ff] hover:bg-[#162338] transition-colors active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-[#facc15] text-[18px]">
                      fast_forward
                    </span>
                    <span>Carry Forward to Today</span>
                  </button>
                )}

                {/* 4. Delete */}
                <button
                  type="button"
                  onClick={() => handleDeleteTask(contextTask)}
                  className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-[#ff5c78] hover:bg-[#ff5c78]/15 transition-colors active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[#ff5c78] text-[18px]">delete</span>
                  <span>Delete Task</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Task Form Modal */}
      <AnimatePresence>
        {editingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setEditingTask(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-md bg-[#0c1320] border border-[#35d9ff]/40 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#202c3d]/40">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-[#35d9ff] text-[20px]">edit_note</span>
                  <h3 className="text-base font-semibold text-[#edf5ff]">Edit Task</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="w-7 h-7 rounded-full bg-[#162338] text-[#91a2b8] hover:text-[#edf5ff] flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-mono text-[#91a2b8]">TASK TITLE *</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    className="bg-[#090f19] border border-[#202c3d] rounded-xl px-3 py-2 text-sm text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-mono text-[#91a2b8]">DESCRIPTION / NOTES</label>
                  <textarea
                    rows={2}
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    placeholder="Add details, links, or notes..."
                    className="bg-[#090f19] border border-[#202c3d] rounded-xl px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] text-[#91a2b8]">ASSIGNED DATE</label>
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={e => setEditDueDate(e.target.value)}
                      className="bg-[#090f19] border border-[#202c3d] rounded-lg px-2 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] text-[#91a2b8]">DUE TIME</label>
                    <input
                      type="text"
                      placeholder="e.g. 7:00 PM"
                      value={editDueTime}
                      onChange={e => setEditDueTime(e.target.value)}
                      className="bg-[#090f19] border border-[#202c3d] rounded-lg px-2 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-3 py-1.5 text-xs font-mono text-[#91a2b8] hover:text-[#edf5ff]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#35d9ff] text-[#003641] font-mono text-xs font-bold shadow-md hover:bg-[#b5edff] active:scale-95 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Circular Floating Productivity Calendar Action Button (Elevated) */}
      <div className="fixed right-5 bottom-28 sm:bottom-32 z-30">
        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            triggerHaptic('light');
            setIsProductivityCalendarOpen(true);
          }}
          aria-label="View daily history and productivity calendar"
          title="Daily History & Productivity Calendar"
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-[#0c1320]/95 backdrop-blur-md text-[#35d9ff] border-2 border-[#35d9ff]/50 shadow-[0_6px_28px_rgba(0,0,0,0.65),0_0_20px_rgba(53,217,255,0.35)] hover:border-[#35d9ff] hover:shadow-[0_0_28px_rgba(53,217,255,0.6)] transition-all focus:outline-none"
        >
          <span className="material-symbols-outlined text-[26px] font-semibold transition-transform duration-200 group-hover:scale-110">
            calendar_month
          </span>
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
