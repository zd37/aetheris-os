import React, { useState, useEffect, useMemo } from 'react';
import { useApp, getLocalDateString } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

export const GymScreen: React.FC = () => {
  const {
    gymGoal,
    setGymGoal,
    gymLogs,
    recordTodayWorkout,
    toggleGymDayLog,
    activeWorkoutPlan,
    toggleExercise,
    setIsGeminiModalOpen,
    setGeminiInitialPrompt,
  } = useApp();

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState(90);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  // Rest timer countdown
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds(s => s - 1);
      }, 1000);
    } else if (restTimerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      try {
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      } catch (e) {}
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, restTimerSeconds]);

  const toggleRestTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
    } else {
      if (restTimerSeconds <= 0) setRestTimerSeconds(90);
      setIsTimerRunning(true);
    }
  };

  const resetRestTimer = () => {
    setIsTimerRunning(false);
    setRestTimerSeconds(90);
  };

  const handleRecordWorkout = () => {
    const nextState = !isSessionActive;
    setIsSessionActive(nextState);
    recordTodayWorkout();
    if (nextState) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#35d9ff', '#5cffb7'],
        });
      } catch (e) {}
    }
  };

  // Dynamic current week representation (Mon - Sun)
  const weekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 is Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const todayStr = getLocalDateString(today);

    return labels.map((label, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = getLocalDateString(d);
      return {
        key: label,
        label,
        dateStr,
        isToday: dateStr === todayStr,
      };
    });
  }, []);

  const completedDaysCount = weekDays.filter(d => gymLogs[d.dateStr]).length;
  const daysRemaining = Math.max(0, gymGoal - completedDaysCount);
  const completionPercentage = Math.round((completedDaysCount / gymGoal) * 100);

  // SVG circle calculation
  const radius = 14;
  const circumference = 2 * Math.PI * radius; // ~88
  const strokeDashoffset = circumference - (Math.min(100, completionPercentage) / 100) * circumference;

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${String(s).padStart(2, '0')}`;
  };

  return (
    <main className="flex flex-col relative w-full px-4 pt-header-safe pb-28 bg-[#070b12] min-h-screen">
      <div className="flex flex-col w-full space-y-4">
        {/* Subheader */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div>
            <span className="font-mono text-xs text-[#32d8fd] uppercase tracking-wider">
              Workout Routine
            </span>
            <h2 className="text-xl font-bold text-[#edf5ff]">Weekly Training Split</h2>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#162338] rounded-full border border-[#202c3d]/40">
            <span className="w-2 h-2 rounded-full bg-[#5cffb7] animate-pulse" />
            <span className="font-mono text-xs text-[#5cffb7]">Active Week</span>
          </div>
        </div>

        {/* Weekly Commitment Card (Matches Image 1) */}
        <section className="bg-[#0c1320] rounded-2xl p-4 shadow-sm border border-[#202c3d]/40 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[#91a2b8]">Weekly Commitment</p>
              <div className="flex items-center space-x-2 mt-0.5">
                <p className="text-base font-semibold text-[#edf5ff]">
                  Weekly Goal: {gymGoal - 1} to {gymGoal} days
                </p>
                <button
                  onClick={() => setShowGoalPicker(!showGoalPicker)}
                  className="text-[#35d9ff] hover:text-[#b5edff] p-0.5 rounded"
                  title="Configure weekly target"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                </button>
              </div>

              {showGoalPicker && (
                <div className="flex items-center space-x-2 mt-2">
                  {[3, 4, 5, 6].map(g => (
                    <button
                      key={g}
                      onClick={() => {
                        setGymGoal(g);
                        setShowGoalPicker(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono ${
                        gymGoal === g ? 'bg-[#35d9ff] text-[#003641] font-bold' : 'bg-[#162338] text-[#91a2b8]'
                      }`}
                    >
                      {g}d
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Circular Gauge */}
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  className="text-[#1f314c]"
                  cx="18"
                  cy="18"
                  fill="none"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <circle
                  className="text-[#35d9ff] transition-all duration-500"
                  cx="18"
                  cy="18"
                  fill="none"
                  r={radius}
                  stroke="currentColor"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
              <span className="absolute font-mono text-xs font-semibold text-[#35d9ff]">
                {completionPercentage}%
              </span>
            </div>
          </div>

          {/* 7-Day Week Columns */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {weekDays.map(day => {
              const isChecked = !!gymLogs[day.dateStr];
              const isToday = day.isToday;

              return (
                <div
                  key={day.key}
                  onClick={() => toggleGymDayLog(day.dateStr)}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl space-y-1 cursor-pointer transition-all ${
                    isToday
                      ? 'bg-[#35d9ff]/15 border border-[#35d9ff]/40 shadow-[0_0_12px_rgba(53,217,255,0.15)]'
                      : isChecked
                      ? 'bg-[#090f19] border border-[#202c3d]/30'
                      : 'bg-[#090f19] opacity-60'
                  }`}
                >
                  <span
                    className={`font-mono text-[10px] uppercase font-bold ${
                      isToday ? 'text-[#35d9ff]' : 'text-[#91a2b8]'
                    }`}
                  >
                    {day.label}
                  </span>

                  {isChecked ? (
                    <div className="w-6 h-6 rounded-full bg-[#5cffb7]/20 text-[#5cffb7] flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </div>
                  ) : isToday ? (
                    <div className="w-6 h-6 rounded-full bg-[#35d9ff] text-[#003641] flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[15px]">fitness_center</span>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#1f314c] text-[#91a2b8] flex items-center justify-center">
                      <span className="font-mono text-[11px]">--</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom stats row */}
          <div className="pt-1 flex items-center justify-between font-mono text-xs">
            <span className="text-[#91a2b8]">
              {completedDaysCount} of {gymGoal} workouts completed this week
            </span>
            <span className="text-[#5cffb7] font-medium">
              {daysRemaining === 0 ? 'Goal Achieved!' : `${daysRemaining} days remaining`}
            </span>
          </div>
        </section>

        {/* Record Workout Big Action Button */}
        <button
          onClick={handleRecordWorkout}
          className={`w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98] ${
            isSessionActive
              ? 'bg-[#5cffb7] text-[#003823] shadow-[0_0_20px_rgba(92,255,183,0.35)]'
              : 'bg-[#35d9ff] text-[#003641] shadow-[0_0_16px_rgba(53,217,255,0.28)] hover:shadow-[0_0_22px_rgba(53,217,255,0.45)]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isSessionActive ? 'pause_circle' : 'play_circle'}
          </span>
          <span>{isSessionActive ? 'Session In Progress...' : "Record Today's Workout"}</span>
        </button>

        {/* Workout Plan Card: Push Day */}
        <section className="bg-[#0c1320] rounded-2xl p-4 border border-[#202c3d]/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#edf5ff]">
                {activeWorkoutPlan.title}
              </h3>
              <p className="text-xs text-[#91a2b8] mt-0.5">{activeWorkoutPlan.focus}</p>
            </div>

            {/* Rest Timer Button */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={toggleRestTimer}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-all text-xs font-mono ${
                  isTimerRunning
                    ? 'bg-[#35d9ff] text-[#003641] font-bold shadow-[0_0_10px_rgba(53,217,255,0.4)]'
                    : 'bg-[#162338] text-[#edf5ff] hover:bg-[#1f314c]'
                }`}
                title="Tap to start / pause rest timer"
              >
                <span className="material-symbols-outlined text-[15px]">timer</span>
                <span>Rest: {formatTimer(restTimerSeconds)}</span>
              </button>

              {restTimerSeconds !== 90 && (
                <button
                  onClick={resetRestTimer}
                  className="p-1 rounded-full bg-[#162338] text-[#91a2b8] hover:text-[#edf5ff]"
                  title="Reset to 1:30"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                </button>
              )}
            </div>
          </div>

          {/* Exercise Rows (Matches Image 1) */}
          <div className="space-y-2">
            {activeWorkoutPlan.exercises.map(exercise => {
              const isDone = exercise.completed;
              return (
                <div
                  key={exercise.id}
                  onClick={() => toggleExercise(exercise.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                    isDone
                      ? 'bg-[#090f19] border-[#5cffb7]/30 opacity-80'
                      : 'bg-[#090f19] border-[#202c3d]/30 hover:border-[#35d9ff]/30'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                        isDone ? 'bg-[#5cffb7] text-[#070b12]' : 'bg-[#1f314c] text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          isDone ? 'line-through text-[#91a2b8]' : 'text-[#edf5ff]'
                        }`}
                      >
                        {exercise.name}
                      </p>
                      <p className="font-mono text-xs text-[#91a2b8]">
                        {exercise.sets} sets × {exercise.reps}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`font-mono text-xs font-semibold ml-2 shrink-0 ${
                      exercise.weight.includes('kg') ? 'text-[#35d9ff]' : 'text-[#91a2b8]'
                    }`}
                  >
                    {exercise.weight}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Gemini Tip Box */}
        <section
          onClick={() => {
            setGeminiInitialPrompt('How is my gym consistency this week and what recovery tips do you recommend?');
            setIsGeminiModalOpen(true);
          }}
          className="flex items-start space-x-3 p-4 bg-[#090f19] rounded-2xl border border-[#202c3d]/40 cursor-pointer hover:border-[#cdbdff]/40 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-[#502cb0]/40 flex items-center justify-center text-[#cdbdff] shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[18px]">psychology</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs text-[#cdbdff] font-semibold">Gemini Tip</p>
              <span className="text-[10px] font-mono text-[#35d9ff] hover:underline">
                Ask Gemini →
              </span>
            </div>
            <p className="text-xs text-[#91a2b8] mt-1 leading-relaxed">
              {completedDaysCount >= 3
                ? "You're on track for your 5-day goal. Good consistency this month! Prioritize shoulder warmups before overhead press."
                : "2 sessions logged. Scheduling your next session for Friday keeps you right in the zone for weekly target completion."}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};
