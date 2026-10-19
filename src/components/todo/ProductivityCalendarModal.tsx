import React, { useState, useMemo } from 'react';
import { useApp, getLocalDateString } from '../../context/AppContext';
import { calculateDayProductivity, DayProductivity } from '../../utils/productivity';
import { motion, AnimatePresence } from 'motion/react';

interface ProductivityCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductivityCalendarModal: React.FC<ProductivityCalendarModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    tasks,
    students,
    attendance,
    payments,
    salahRecords,
    gymLogs,
    selectedCalendarDate,
    setSelectedCalendarDate,
    carryForwardTask,
  } = useApp();

  const todayStr = getLocalDateString();

  // Active view: 'calendar' | 'day_detail'
  const [currentView, setCurrentView] = useState<'calendar' | 'day_detail'>('calendar');

  // Month navigation state
  const initialDateObj = useMemo(() => {
    return selectedCalendarDate ? new Date(selectedCalendarDate + 'T12:00:00') : new Date();
  }, [selectedCalendarDate]);

  const [currentYear, setCurrentYear] = useState(() => initialDateObj.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => initialDateObj.getMonth());
  const [carryForwardNotice, setCarryForwardNotice] = useState<string | null>(null);

  // Month metadata
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const weekdayShortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Align Monday as first day of the week (0 = Monday, 6 = Sunday)
  const firstDayRaw = new Date(currentYear, currentMonth, 1).getDay();
  const firstDayIndex = (firstDayRaw + 6) % 7;

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Calendar cells
  const calendarCells = useMemo(() => {
    const cells: (string | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push(dStr);
    }
    return cells;
  }, [currentYear, currentMonth, firstDayIndex, daysInMonth]);

  // Selected date productivity data
  const selectedProductivity: DayProductivity = useMemo(() => {
    return calculateDayProductivity(tasks, selectedCalendarDate, todayStr);
  }, [tasks, selectedCalendarDate, todayStr]);

  // Format selected date label for header
  const selectedDateFormatted = useMemo(() => {
    try {
      const d = new Date(selectedCalendarDate + 'T12:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return selectedCalendarDate;
    }
  }, [selectedCalendarDate]);

  // Selected date detailed date string
  const selectedFullDateFormatted = useMemo(() => {
    try {
      const d = new Date(selectedCalendarDate + 'T12:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return selectedCalendarDate;
    }
  }, [selectedCalendarDate]);

  // Selected date tasks
  const selectedDayTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.period !== 'daily') return false;
      if (t.dueDate === selectedCalendarDate) return true;
      if (!t.dueDate && selectedCalendarDate === todayStr) return true;
      return false;
    });
  }, [tasks, selectedCalendarDate, todayStr]);

  // Selected date tuition attendance
  const selectedDayAttendance = useMemo(() => {
    return attendance.filter(a => a.date === selectedCalendarDate);
  }, [attendance, selectedCalendarDate]);

  // Selected date tuition payments
  const selectedDayPayments = useMemo(() => {
    return payments.filter(p => p.paymentDate === selectedCalendarDate);
  }, [payments, selectedCalendarDate]);

  // Selected date Salah record
  const selectedDaySalah = useMemo(() => {
    return (
      salahRecords[selectedCalendarDate] || {
        date: selectedCalendarDate,
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false,
      }
    );
  }, [salahRecords, selectedCalendarDate]);

  // Selected date gym record
  const hasGymOnDate = Boolean(gymLogs[selectedCalendarDate]);

  const handleCarryForward = (taskId: string, taskTitle: string) => {
    carryForwardTask(taskId);
    setCarryForwardNotice(`"${taskTitle.slice(0, 24)}..." carried forward to today!`);
    setTimeout(() => {
      setCarryForwardNotice(null);
    }, 2800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Centered Modal Container (Pops forward from behind) */}
      <motion.div
        initial={{ scale: 0.82, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.82, opacity: 0 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-lg bg-[#0c1320] border border-[#202c3d]/80 rounded-3xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden text-[#edf5ff]"
      >

        {/* Carry Forward Feedback Toast */}
        <AnimatePresence>
          {carryForwardNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 inset-x-6 z-30 bg-[#35d9ff]/20 border border-[#35d9ff]/60 text-[#35d9ff] px-3.5 py-2 rounded-xl text-xs font-mono text-center backdrop-blur-xl shadow-lg flex items-center justify-center space-x-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              <span>{carryForwardNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content View Switcher */}
        <AnimatePresence mode="wait">
          {currentView === 'calendar' ? (
            /* ================= CALENDAR VIEW ================= */
            <motion.div
              key="calendar-view"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="p-4 sm:p-5 flex flex-col space-y-4 overflow-y-auto"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-[#202c3d]/40">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-[#35d9ff]/15 border border-[#35d9ff]/30 flex items-center justify-center text-[#35d9ff]">
                    <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#edf5ff] leading-tight">
                      Productivity History
                    </h3>
                    <p className="font-mono text-[10px] text-[#91a2b8]">
                      Four-stage completion telemetry
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close calendar"
                  className="w-7 h-7 rounded-full bg-[#162338] text-[#91a2b8] hover:text-[#edf5ff] flex items-center justify-center transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {/* Month Selector Bar */}
              <div className="flex items-center justify-between bg-[#090f19] px-3 py-2 rounded-2xl border border-[#202c3d]/40">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                  className="w-8 h-8 rounded-xl bg-[#162338]/60 hover:bg-[#162338] text-[#91a2b8] hover:text-[#edf5ff] flex items-center justify-center transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                <div className="text-center font-mono">
                  <span className="text-sm font-bold text-[#edf5ff]">
                    {monthNames[currentMonth]}
                  </span>
                  <span className="text-xs text-[#35d9ff] ml-1.5 font-medium">
                    {currentYear}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Next month"
                  className="w-8 h-8 rounded-xl bg-[#162338]/60 hover:bg-[#162338] text-[#91a2b8] hover:text-[#edf5ff] flex items-center justify-center transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>

              {/* 7-Column Day Grid */}
              <div className="flex flex-col space-y-1">
                {/* Weekday Labels (Mon-Sun) */}
                <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-[#91a2b8] py-1">
                  {weekdayShortNames.map(d => (
                    <span key={d} className="uppercase font-semibold">
                      {d}
                    </span>
                  ))}
                </div>

                {/* Date Cells */}
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarCells.map((dateStr, idx) => {
                    if (!dateStr) {
                      return <div key={`empty-${idx}`} className="h-10 rounded-xl" />;
                    }

                    const dayNum = parseInt(dateStr.split('-')[2], 10);
                    const isSelected = dateStr === selectedCalendarDate;
                    const isToday = dateStr === todayStr;
                    const prod = calculateDayProductivity(tasks, dateStr, todayStr);

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedCalendarDate(dateStr)}
                        className={`relative h-11 rounded-xl flex flex-col items-center justify-center transition-all duration-150 active:scale-95 border ${
                          prod.cellBg
                        } ${prod.cellBorder} ${
                          isSelected
                            ? 'ring-2 ring-[#35d9ff] border-[#35d9ff] bg-[#162338] shadow-[0_0_12px_rgba(53,217,255,0.3)] z-10 scale-[1.03]'
                            : ''
                        }`}
                        title={`${dateStr}: ${prod.label} (${prod.completed}/${prod.totalEligible})`}
                      >
                        {/* Today Marker Dot */}
                        {isToday && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#35d9ff] shadow-[0_0_6px_#35d9ff]" />
                        )}

                        {/* Date Number with Color-Coded Background & Border (No Red Dots) */}
                        <span
                          className={`text-xs font-mono font-semibold ${
                            isSelected ? 'text-[#35d9ff] font-bold' : prod.textColor
                          }`}
                        >
                          {dayNum}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Day Action Bar */}
              <div className="bg-[#090f19] p-3 rounded-2xl border border-[#202c3d]/50 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#edf5ff]">
                      {selectedDateFormatted}
                    </span>
                    <span className="font-mono text-[10px] text-[#91a2b8]">
                      {selectedProductivity.totalEligible > 0
                        ? `${selectedProductivity.completed}/${selectedProductivity.totalEligible} Tasks • ${selectedProductivity.percentage}%`
                        : selectedProductivity.isFuture
                        ? 'Future Date'
                        : 'No Daily Tasks'}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono border font-medium ${selectedProductivity.badgeBg} ${selectedProductivity.badgeText} ${selectedProductivity.badgeBorder}`}
                  >
                    {selectedProductivity.label}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentView('day_detail')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#35d9ff] text-[#003641] font-mono text-xs font-bold hover:bg-[#b5edff] transition-all active:scale-95 shadow-md shrink-0"
                >
                  <span>View Day</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </button>
              </div>

              {/* Compact Color Legend */}
              <div className="pt-1 border-t border-[#202c3d]/30">
                <div className="flex items-center justify-between flex-wrap gap-2 text-[10px] font-mono text-[#91a2b8] px-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#5cffb7]" />
                    <span>100%</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#facc15]" />
                    <span>75–99%</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#fb923c]" />
                    <span>40–74%</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ff5c78]" />
                    <span>0–39%</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#43556d]" />
                    <span>No tasks</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ================= DAY DETAIL SUMMARY VIEW ================= */
            <motion.div
              key="day-detail-view"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.18 }}
              className="p-4 sm:p-5 flex flex-col space-y-4 overflow-y-auto max-h-[82vh]"
            >
              {/* Header with Back button and Close */}
              <div className="flex items-center justify-between pb-2 border-b border-[#202c3d]/40">
                <button
                  type="button"
                  onClick={() => setCurrentView('calendar')}
                  className="inline-flex items-center space-x-1 text-xs font-mono text-[#35d9ff] hover:text-[#b5edff] transition-colors py-1 px-2 rounded-lg bg-[#162338]/60 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>Calendar</span>
                </button>

                <div className="text-center">
                  <h3 className="text-sm font-semibold text-[#edf5ff] leading-tight">
                    Daily Activity History
                  </h3>
                  <p className="font-mono text-[10px] text-[#91a2b8]">
                    {selectedFullDateFormatted}
                  </p>
                </div>

                <button
                  onClick={onClose}
                  aria-label="Close modal"
                  className="w-7 h-7 rounded-full bg-[#162338] text-[#91a2b8] hover:text-[#edf5ff] flex items-center justify-center transition-colors active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {/* Productivity Overview Hero */}
              <div className="grid grid-cols-3 gap-2.5 bg-[#090f19] p-3.5 rounded-2xl border border-[#202c3d]/50">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-[#91a2b8] uppercase">
                    Status
                  </span>
                  <span
                    className={`text-xs font-bold font-mono mt-0.5 ${selectedProductivity.textColor}`}
                  >
                    {selectedProductivity.label}
                  </span>
                </div>

                <div className="flex flex-col text-center">
                  <span className="font-mono text-[10px] text-[#91a2b8] uppercase">
                    Tasks
                  </span>
                  <span className="text-sm font-bold font-mono text-[#edf5ff] mt-0.5">
                    {selectedProductivity.completed} / {selectedProductivity.totalEligible}
                  </span>
                </div>

                <div className="flex flex-col text-right">
                  <span className="font-mono text-[10px] text-[#91a2b8] uppercase">
                    Productivity
                  </span>
                  <span
                    className={`text-sm font-bold font-mono mt-0.5 ${selectedProductivity.textColor}`}
                  >
                    {selectedProductivity.percentage}%
                  </span>
                </div>
              </div>

              {/* 1. TASKS SECTION */}
              <div className="bg-[#090f19] p-3.5 rounded-2xl border border-[#202c3d]/40 flex flex-col space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#35d9ff]" />
                    <h4 className="text-xs font-bold text-[#edf5ff] tracking-wide uppercase font-mono">
                      Tasks ({selectedDayTasks.length})
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] text-[#91a2b8]">
                    {selectedDayTasks.filter(t => t.completed).length} of {selectedDayTasks.length} Completed
                  </span>
                </div>

                {selectedDayTasks.length === 0 ? (
                  <p className="text-xs text-[#91a2b8] font-mono py-1">
                    No daily tasks recorded for this date.
                  </p>
                ) : (
                  <div className="flex flex-col space-y-2">
                    {selectedDayTasks.map(task => {
                      const isUnfinishedPast =
                        !task.completed && selectedCalendarDate < todayStr;

                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c1320] border border-[#202c3d]/40 text-xs"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                            <span
                              className={`material-symbols-outlined text-[16px] shrink-0 ${
                                task.completed ? 'text-[#5cffb7]' : 'text-[#91a2b8]'
                              }`}
                            >
                              {task.completed ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p
                                className={`truncate font-medium ${
                                  task.completed ? 'line-through text-[#91a2b8]' : 'text-[#edf5ff]'
                                }`}
                              >
                                {task.title}
                              </p>
                              <div className="flex items-center space-x-2 font-mono text-[10px] text-[#91a2b8] mt-0.5">
                                <span>{task.category}</span>
                                {task.dueTime && <span>• {task.dueTime}</span>}
                              </div>
                            </div>
                          </div>

                          {/* Carry Forward action for unfinished historical tasks */}
                          {isUnfinishedPast && (
                            <button
                              type="button"
                              onClick={() => handleCarryForward(task.id, task.title)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#35d9ff]/15 hover:bg-[#35d9ff]/25 text-[#35d9ff] border border-[#35d9ff]/30 text-[11px] font-mono shrink-0 active:scale-95 transition-all"
                              title="Carry forward to today's task list"
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                fast_forward
                              </span>
                              <span>Carry to Today</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. TUITION SECTION */}
              <div className="bg-[#090f19] p-3.5 rounded-2xl border border-[#202c3d]/40 flex flex-col space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5cffb7]" />
                    <h4 className="text-xs font-bold text-[#edf5ff] tracking-wide uppercase font-mono">
                      Tuition &amp; Classes
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] text-[#91a2b8]">
                    {selectedDayAttendance.length} Session(s)
                  </span>
                </div>

                {selectedDayAttendance.length === 0 && selectedDayPayments.length === 0 ? (
                  <p className="text-xs text-[#91a2b8] font-mono py-1">
                    No tuition attendance or payments logged on this date.
                  </p>
                ) : (
                  <div className="flex flex-col space-y-2">
                    {/* Attendance sessions */}
                    {selectedDayAttendance.map(att => {
                      const student = students.find(s => s.id === att.studentId);
                      const isDone = att.status === 'completed';
                      return (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-[#0c1320] border border-[#202c3d]/30 text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <span
                              className={`material-symbols-outlined text-[16px] ${
                                isDone ? 'text-[#5cffb7]' : 'text-[#facc15]'
                              }`}
                            >
                              school
                            </span>
                            <span className="font-medium text-[#edf5ff]">
                              {student?.name || 'Student Session'}
                            </span>
                          </div>
                          <span
                            className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded-full ${
                              isDone
                                ? 'bg-[#5cffb7]/15 text-[#5cffb7]'
                                : 'bg-[#facc15]/15 text-[#facc15]'
                            }`}
                          >
                            {att.status}
                          </span>
                        </div>
                      );
                    })}

                    {/* Tuition Payments */}
                    {selectedDayPayments.map(pay => (
                      <div
                        key={pay.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#0c1320] border border-[#5cffb7]/30 text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="material-symbols-outlined text-[#5cffb7] text-[16px]">
                            payments
                          </span>
                          <span className="font-medium text-[#edf5ff]">
                            {pay.studentName || 'Student'} Payment
                          </span>
                        </div>
                        <span className="font-mono font-bold text-[#5cffb7]">
                          +৳{pay.amount.toLocaleString()} ({pay.method || 'bKash'})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. PRAYER TRACKER SECTION */}
              <div className="bg-[#090f19] p-3.5 rounded-2xl border border-[#202c3d]/40 flex flex-col space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5cffb7]" />
                    <h4 className="text-xs font-bold text-[#edf5ff] tracking-wide uppercase font-mono">
                      Salah Prayer Tracker
                    </h4>
                  </div>
                  <span className="font-mono text-[10px] text-[#5cffb7] font-semibold">
                    {[
                      selectedDaySalah.fajr,
                      selectedDaySalah.dhuhr,
                      selectedDaySalah.asr,
                      selectedDaySalah.maghrib,
                      selectedDaySalah.isha,
                    ].filter(Boolean).length}
                    /5 Offered
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {(
                    [
                      { key: 'fajr', label: 'Fajr' },
                      { key: 'dhuhr', label: 'Dhuhr' },
                      { key: 'asr', label: 'Asr' },
                      { key: 'maghrib', label: 'Maghrib' },
                      { key: 'isha', label: 'Isha' },
                    ] as const
                  ).map(prayer => {
                    const isOffered = Boolean(selectedDaySalah[prayer.key]);
                    return (
                      <div
                        key={prayer.key}
                        className={`p-2 rounded-xl text-center border flex flex-col items-center justify-center space-y-1 transition-all ${
                          isOffered
                            ? 'bg-[#5cffb7] text-[#003822] border-[#5cffb7] shadow-[0_0_10px_rgba(92,255,183,0.35)]'
                            : 'bg-[#0c1320] border-[#202c3d]/30 text-[#91a2b8]'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-[15px] ${isOffered ? 'text-[#003822] font-bold' : 'text-[#91a2b8]/60'}`}>
                          {isOffered ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className={`font-mono text-[10px] font-semibold ${isOffered ? 'text-[#003822] font-bold' : 'text-[#91a2b8]'}`}>
                          {prayer.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. OTHER LOGGED ACTIVITY SECTION (Gym / Fitness) */}
              {hasGymOnDate && (
                <div className="bg-[#090f19] p-3.5 rounded-2xl border border-[#202c3d]/40 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#5cffb7]/15 border border-[#5cffb7]/30 flex items-center justify-center text-[#5cffb7]">
                      <span className="material-symbols-outlined text-[16px]">fitness_center</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#edf5ff]">Gym Workout</p>
                      <p className="font-mono text-[10px] text-[#91a2b8]">
                        Workout logged for this date
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#5cffb7]/15 text-[#5cffb7] border border-[#5cffb7]/30 font-semibold">
                    Completed
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
