import React, { useState } from 'react';
import { useApp, getLocalDateString } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export const HomeScreen: React.FC = () => {
  const {
    preferences,
    tasks,
    toggleTask,
    addTask,
    salahRecords,
    togglePrayer,
    getTodaySalah,
    students,
    setActiveTab,
    setIsGeminiModalOpen,
    setGeminiInitialPrompt,
    setIsNotesModalOpen,
    recordTodayWorkout,
    isGeminiSuggestionDismissed,
    dismissGeminiSuggestion,
  } = useApp();

  const [isAiDismissedLocally, setIsAiDismissedLocally] = useState(false);
  const isAiDismissed = isGeminiSuggestionDismissed || isAiDismissedLocally;
  const [isScheduleGymDone, setIsScheduleGymDone] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  const todaySalah = getTodaySalah();

  const completedSalahCount = [
    todaySalah.fajr,
    todaySalah.dhuhr,
    todaySalah.asr,
    todaySalah.maghrib,
    todaySalah.isha,
  ].filter(Boolean).length;

  const todayTasks = tasks.filter(t => t.period === 'daily');
  const completedTasksCount = todayTasks.filter(t => t.completed).length;
  const taskProgressPercent =
    todayTasks.length > 0 ? Math.round((completedTasksCount / todayTasks.length) * 100) : 0;

  // Format date display
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const monthDay = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  const dateFormatted = `${dayName}, ${monthDay}`;

  // Time of day greeting
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const handleSalahClick = (prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha') => {
    const willComplete = !todaySalah[prayer];
    togglePrayer(prayer);
    if (willComplete && completedSalahCount === 4) {
      // Completed all 5 prayers!
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 },
          colors: ['#5cffb7', '#35d9ff'],
        });
      } catch (e) {}
    }
  };

  const handleScheduleGym = () => {
    addTask({
      title: 'Gym: Upper Body Push (45m)',
      completed: false,
      priority: 'Medium',
      category: 'Health',
      dueDate: getLocalDateString(),
      dueTime: '7:00 PM',
      period: 'daily',
    });
    setIsScheduleGymDone(true);
    setTimeout(() => {
      setIsAiDismissedLocally(true);
      dismissGeminiSuggestion(4);
    }, 2000);
  };

  const handleAddQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    addTask({
      title: quickTaskTitle.trim(),
      completed: false,
      priority: 'Medium',
      category: 'Personal',
      dueDate: getLocalDateString(),
      period: 'daily',
    });
    setQuickTaskTitle('');
    setShowQuickAddModal(false);
  };

  const nextTuition = students.find(s => s.nextSessionTime) || students[0];

  return (
    <main className="flex flex-col relative w-full px-4 pt-header-safe pb-28 bg-[#070b12] min-h-screen">
      <div className="flex flex-col w-full space-y-6 pb-6">
        {/* 1. Header Greeting */}
        <section className="flex flex-col space-y-1 pt-1">
          <span className="font-mono text-xs text-[#91a2b8] font-medium tracking-wide uppercase">
            {dateFormatted}
          </span>
          <h2 className="text-3xl text-[#edf5ff] font-semibold tracking-tight">
            {greeting}, {preferences.name}
          </h2>
        </section>

        {/* 2. Gemini Proactive Suggestion Card */}
        <AnimatePresence>
          {!isAiDismissed && (
            <motion.section
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.25 }}
              className="relative overflow-hidden rounded-2xl bg-[#162338]/60 backdrop-blur-xl p-5 shadow-sm border border-[#202c3d]/40 transition-all hover:bg-[#162338]/80"
            >
              {/* Subtle violet ambient glow pool */}
              <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#502cb0]/20 blur-2xl" />

              <div className="relative z-10 flex flex-col space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#502cb0]/40 text-[#cdbdff]">
                      <span className="material-symbols-outlined text-[17px]">auto_awesome</span>
                    </div>
                    <span className="font-mono text-[10px] tracking-widest text-[#cdbdff] font-semibold uppercase">
                      Gemini Assistant
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setGeminiInitialPrompt('Analyze my day and suggest optimal focus blocks.');
                      setIsGeminiModalOpen(true);
                    }}
                    className="text-[11px] font-mono text-[#35d9ff] hover:underline"
                  >
                    Open Copilot
                  </button>
                </div>

                <p className="text-[15px] text-[#edf5ff] leading-relaxed">
                  {isScheduleGymDone
                    ? 'Gym session scheduled for 7:00 PM! Added to your daily tasks list.'
                    : `You have ${todayTasks.filter(t => !t.completed).length} priority tasks today and ${nextTuition?.name || 'tuition'} session lined up. Would you like me to schedule a 45-min gym window at 7:00 PM?`}
                </p>

                {!isScheduleGymDone && (
                  <div className="flex items-center pt-1 space-x-2.5">
                    <button
                      onClick={handleScheduleGym}
                      className="inline-flex items-center space-x-1.5 rounded-full bg-[#cdbdff] px-4 py-2 text-[#370095] text-xs font-semibold shadow-md transition-transform active:scale-95 hover:opacity-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_task</span>
                      <span>Schedule Gym</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsAiDismissedLocally(true);
                        dismissGeminiSuggestion(4);
                      }}
                      className="inline-flex items-center rounded-full bg-[#1f314c] px-3.5 py-2 text-[#91a2b8] text-xs font-medium transition-colors hover:text-[#edf5ff] active:scale-95"
                    >
                      <span>Dismiss</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* 3. Today's Overview (Two-card layout) */}
        <section className="grid grid-cols-2 gap-3.5">
          {/* Card 1: Today's Tasks */}
          <div
            onClick={() => setActiveTab('todo')}
            className="flex flex-col justify-between rounded-2xl bg-[#090f19] p-4 shadow-sm min-h-[148px] border border-[#202c3d]/30 cursor-pointer hover:border-[#35d9ff]/30 transition-all active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#91a2b8]">Today's Tasks</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0c1320] text-[#35d9ff]">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
              </div>
            </div>

            <div className="my-auto py-2">
              <div className="flex items-baseline space-x-1.5 font-mono">
                <span className="text-2xl font-bold text-[#edf5ff]">
                  {completedTasksCount}
                </span>
                <span className="text-sm text-[#91a2b8]">/ {todayTasks.length}</span>
              </div>
              <span className="font-mono text-xs text-[#35d9ff]">
                {taskProgressPercent}% completed
              </span>
            </div>

            {/* Smooth Progress Bar */}
            <div className="h-1.5 w-full rounded-full bg-[#1f314c] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#35d9ff] transition-all duration-300"
                style={{ width: `${taskProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Card 2: Tuition & Gym Schedule */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#090f19] p-4 shadow-sm min-h-[148px] border border-[#202c3d]/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#91a2b8]">Schedule</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0c1320] text-[#cdbdff]">
                <span className="material-symbols-outlined text-[16px]">event</span>
              </div>
            </div>

            <div className="flex flex-col space-y-2 py-1">
              {nextTuition ? (
                <div
                  onClick={() => setActiveTab('tuition')}
                  className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                >
                  <div className="h-2 w-2 rounded-full bg-[#5cffb7]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#edf5ff] truncate">
                      {nextTuition.name} Session
                    </p>
                    <p className="font-mono text-[10px] text-[#91a2b8]">
                      {nextTuition.nextSessionTime || 'Scheduled'}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setActiveTab('tuition')}
                  className="flex items-center space-x-2 cursor-pointer hover:opacity-80 text-[#91a2b8]"
                >
                  <div className="h-2 w-2 rounded-full bg-[#202c3d]" />
                  <span className="text-xs">No tuition sessions</span>
                </div>
              )}

              <div
                onClick={() => setActiveTab('gym')}
                className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
              >
                <div className="h-2 w-2 rounded-full bg-[#35d9ff]" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#edf5ff] truncate">
                    Gym: Push Day
                  </p>
                  <p className="font-mono text-[10px] text-[#91a2b8]">7:00 PM</p>
                </div>
              </div>
            </div>

            <span className="font-mono text-[10px] text-[#91a2b8] tracking-wider uppercase">
              {nextTuition ? 'Next up in 3h' : 'Daily Routine'}
            </span>
          </div>
        </section>

        {/* 4. Daily Salah Tracker Section */}
        <section className="rounded-2xl bg-[#090f19] border border-[#202c3d]/40 p-4 shadow-sm relative overflow-hidden transition-all duration-300">
          <div className="pointer-events-none absolute -right-8 -bottom-8 h-28 w-28 rounded-full bg-[#5cffb7]/10 blur-2xl" />

          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5cffb7]/15 text-[#5cffb7]">
                <span className="material-symbols-outlined text-[19px]">mosque</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#edf5ff] leading-tight">
                  Daily Salah
                </h3>
                <p className="font-mono text-xs text-[#91a2b8]">Prayer Times</p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 rounded-full bg-[#162338] px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5cffb7] animate-pulse" />
              <span className="font-mono text-xs font-medium text-[#5cffb7]">
                {completedSalahCount} of 5 completed
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-[#1f314c] overflow-hidden mb-3.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#35d9ff] to-[#5cffb7] transition-all duration-300"
              style={{ width: `${(completedSalahCount / 5) * 100}%` }}
            />
          </div>

          {/* 5 Prayers Grid */}
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { key: 'fajr', label: 'Fajr', time: '04:55' },
              { key: 'dhuhr', label: 'Dhuhr', time: '12:15' },
              { key: 'asr', label: 'Asr', time: '03:45' },
              { key: 'maghrib', label: 'Maghrib', time: '05:40' },
              { key: 'isha', label: 'Isha', time: '07:10' },
            ].map(prayer => {
              const isDone = !!todaySalah[prayer.key as keyof typeof todaySalah];
              return (
                <button
                  key={prayer.key}
                  type="button"
                  onClick={() => handleSalahClick(prayer.key as any)}
                  className={`flex flex-col items-center justify-between rounded-xl p-2 py-2.5 transition-all duration-200 active:scale-95 ${
                    isDone
                      ? 'border border-[#5cffb7]/70 bg-[#5cffb7]/10 shadow-[0_0_12px_rgba(92,255,183,0.18)]'
                      : 'bg-[#0c1320] hover:bg-[#162338] border border-[#202c3d]/40'
                  }`}
                >
                  <span className="text-[12px] font-semibold text-[#edf5ff]">
                    {prayer.label}
                  </span>
                  <span className="font-mono text-[10px] text-[#91a2b8] mt-0.5">
                    {prayer.time}
                  </span>
                  <div
                    className={`mt-2 flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200 ${
                      isDone
                        ? 'bg-[#5cffb7] text-[#070b12]'
                        : 'bg-[#1f314c] text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px] font-bold">
                      check
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. Tasks Section */}
        <section className="flex flex-col space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-semibold text-[#edf5ff]">Tasks</h3>
            <button
              onClick={() => setActiveTab('todo')}
              className="font-mono text-xs text-[#35d9ff] hover:underline font-medium"
            >
              View all
            </button>
          </div>

          <div className="flex flex-col space-y-2.5">
            {todayTasks.length === 0 ? (
              <div className="p-4 rounded-2xl bg-[#090f19] border border-[#202c3d]/30 text-center space-y-1.5">
                <p className="text-xs text-[#91a2b8]">No daily tasks yet.</p>
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(true)}
                  className="text-xs text-[#35d9ff] font-mono hover:underline inline-flex items-center space-x-1"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                  <span>Add your first task</span>
                </button>
              </div>
            ) : (
              todayTasks.slice(0, 5).map(task => {
              const isChecked = task.completed;
              return (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`group relative flex items-center justify-between rounded-2xl p-4 transition-all duration-200 active:scale-[0.99] cursor-pointer ${
                    isChecked
                      ? 'bg-[#090f19]/60 border border-[#202c3d]/20 opacity-75'
                      : 'bg-[#090f19] hover:bg-[#0c1320] border border-[#202c3d]/30'
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0 pr-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isChecked ? 'bg-[#5cffb7]' : 'bg-[#1f314c]'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[16px] text-[#070b12] font-bold transition-opacity ${
                          isChecked ? 'opacity-100' : 'opacity-0'
                        }`}
                      >
                        check
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span
                        className={`text-[15px] font-medium truncate ${
                          isChecked ? 'line-through text-[#91a2b8]' : 'text-[#edf5ff]'
                        }`}
                      >
                        {task.title}
                      </span>
                      <span className="font-mono text-xs text-[#91a2b8] flex items-center mt-0.5 space-x-1">
                        {isChecked ? (
                          <span className="text-[#5cffb7]">Completed {task.completedAt || 'today'}</span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[13px] text-[#35d9ff]">
                              schedule
                            </span>
                            <span>{task.dueTime ? `Due ${task.dueTime}` : 'Due today'}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${
                      task.category === 'Uni'
                        ? 'bg-[#162338] text-[#35d9ff]'
                        : task.category === 'Tuition'
                        ? 'bg-[#162338] text-[#cdbdff]'
                        : task.category === 'Health'
                        ? 'bg-[#162338] text-[#5cffb7]'
                        : 'bg-[#0c1320] text-[#91a2b8]'
                    }`}
                  >
                    {isChecked ? 'Done' : task.category}
                  </span>
                </div>
              );
            }))}
          </div>
        </section>
      </div>

      {/* Floating Action Button (+) */}
      <div className="fixed right-5 bottom-28 sm:bottom-32 z-30">
        <button
          onClick={() => setIsFabOpen(!isFabOpen)}
          aria-label="Add new item"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#35d9ff] text-[#003641] shadow-[0_4px_20px_rgba(53,217,255,0.4)] transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none"
        >
          <span
            className={`material-symbols-outlined text-[28px] font-semibold transition-transform duration-200 ${
              isFabOpen ? 'rotate-45' : ''
            }`}
          >
            add
          </span>
        </button>

        {/* FAB Menu */}
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-16 right-0 mb-2 w-52 bg-[#0c1320] border border-[#202c3d] rounded-2xl p-2 shadow-2xl flex flex-col space-y-1"
            >
              <button
                onClick={() => {
                  setIsFabOpen(false);
                  setShowQuickAddModal(true);
                }}
                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-[#edf5ff] hover:bg-[#162338] transition-colors"
              >
                <span className="material-symbols-outlined text-[#35d9ff] text-[18px]">add_task</span>
                <span>Add Task</span>
              </button>
              <button
                onClick={() => {
                  setIsFabOpen(false);
                  recordTodayWorkout();
                }}
                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-[#edf5ff] hover:bg-[#162338] transition-colors"
              >
                <span className="material-symbols-outlined text-[#5cffb7] text-[18px]">fitness_center</span>
                <span>Log Gym Workout</span>
              </button>
              <button
                onClick={() => {
                  setIsFabOpen(false);
                  setIsNotesModalOpen(true);
                }}
                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-[#edf5ff] hover:bg-[#162338] transition-colors"
              >
                <span className="material-symbols-outlined text-[#cdbdff] text-[18px]">sticky_note_2</span>
                <span>Quick Note</span>
              </button>
              <button
                onClick={() => {
                  setIsFabOpen(false);
                  setActiveTab('tuition');
                }}
                className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-[#edf5ff] hover:bg-[#162338] transition-colors"
              >
                <span className="material-symbols-outlined text-[#35d9ff] text-[18px]">school</span>
                <span>Tuition Records</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Add Task Dialog */}
      <AnimatePresence>
        {showQuickAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowQuickAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-sm bg-[#0c1320] border border-[#202c3d] rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-semibold text-[#edf5ff]">New Task</h3>
              <form onSubmit={handleAddQuickTask} className="space-y-4">
                <input
                  type="text"
                  autoFocus
                  value={quickTaskTitle}
                  onChange={e => setQuickTaskTitle(e.target.value)}
                  placeholder="Task description..."
                  className="w-full bg-[#070b12] border border-[#202c3d] rounded-xl px-3 py-2.5 text-sm text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                />
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddModal(false)}
                    className="px-4 py-2 text-xs font-mono text-[#91a2b8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#35d9ff] text-[#003641] font-semibold text-xs font-mono shadow-md"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};
