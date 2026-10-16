import React, { useState } from 'react';
import { useApp, getLocalDateString } from '../../context/AppContext';
import { AttendanceStatus } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface OverallCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OverallCalendarModal: React.FC<OverallCalendarModalProps> = ({ isOpen, onClose }) => {
  const { students, attendance, recordAttendance, removeAttendanceForDateStudent } = useApp();

  const todayStr = getLocalDateString();
  const initialDate = new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  if (!isOpen) return null;

  // Days in month calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

  // Find attendance records for the selected date
  const dateAttendance = attendance.filter(a => a.date === selectedDate);
  const completedStudentIds = dateAttendance
    .filter(a => a.status === 'completed')
    .map(a => a.studentId);

  const handleToggleAttendance = (studentId: string) => {
    const existing = attendance.find(a => a.date === selectedDate && a.studentId === studentId);
    if (!existing || existing.status === 'unmarked') {
      recordAttendance(selectedDate, [studentId], 'completed');
    } else {
      removeAttendanceForDateStudent(selectedDate, studentId);
    }
  };

  const handleSetStudentStatus = (studentId: string, status: AttendanceStatus) => {
    if (status === 'unmarked') {
      removeAttendanceForDateStudent(selectedDate, studentId);
    } else {
      recordAttendance(selectedDate, [studentId], status);
    }
  };

  // Formatted date string for display
  const selectedDateObj = new Date(selectedDate + 'T12:00:00');
  const selectedDateFormatted = selectedDateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Build grid days
  const calendarCells: (string | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push(dStr);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative z-10 w-full max-w-lg bg-[#0c1320] border-t sm:border border-[#202c3d]/70 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] flex flex-col space-y-4 overflow-y-auto"
      >
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-[#202c3d] rounded-full mx-auto shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#202c3d]/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#35d9ff]/15 flex items-center justify-center text-[#35d9ff] border border-[#35d9ff]/30 shadow-[0_0_12px_rgba(53,217,255,0.2)]">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#edf5ff]">Tuition Calendar</h3>
              <p className="font-mono text-xs text-[#91a2b8]">Attendance &amp; Schedule Master</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#162338] hover:bg-[#1f314c] flex items-center justify-center text-[#91a2b8] hover:text-[#edf5ff] transition-colors"
            title="Close calendar"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h4 className="text-sm font-semibold font-mono text-[#35d9ff]">
              {monthNames[currentMonth]} {currentYear}
            </h4>
            <span className="font-mono text-[10px] text-[#91a2b8]">
              {selectedDate === todayStr ? 'Today selected' : `Viewing ${selectedDate}`}
            </span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-lg bg-[#162338] hover:bg-[#1f314c] flex items-center justify-center text-[#91a2b8] hover:text-[#edf5ff] active:scale-95 transition-all"
              title="Previous Month"
            >
              <span className="material-symbols-outlined text-[17px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setCurrentYear(now.getFullYear());
                setCurrentMonth(now.getMonth());
                setSelectedDate(todayStr);
              }}
              className="px-2 py-1 rounded-lg bg-[#162338] hover:bg-[#1f314c] text-[10px] font-mono text-[#91a2b8] hover:text-[#35d9ff] active:scale-95 transition-all"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-lg bg-[#162338] hover:bg-[#1f314c] flex items-center justify-center text-[#91a2b8] hover:text-[#edf5ff] active:scale-95 transition-all"
              title="Next Month"
            >
              <span className="material-symbols-outlined text-[17px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-[#090f19] p-3 rounded-2xl border border-[#202c3d]/50">
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-[#91a2b8] mb-2 uppercase font-medium">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
            {calendarCells.map((dateStr, idx) => {
              if (!dateStr) {
                return <div key={`empty-${idx}`} className="h-8" />;
              }

              const dayNum = parseInt(dateStr.split('-')[2], 10);
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;
              const dayAttendance = attendance.filter(a => a.date === dateStr && a.status === 'completed');
              const hasClasses = dayAttendance.length > 0;

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-9 rounded-xl flex flex-col items-center justify-center transition-all relative ${
                    isSelected
                      ? 'bg-[#35d9ff] text-[#003641] font-bold shadow-[0_0_12px_rgba(53,217,255,0.45)] scale-[1.03]'
                      : isToday
                      ? 'border border-[#35d9ff]/60 text-[#35d9ff] font-semibold bg-[#162338]/40'
                      : hasClasses
                      ? 'bg-[#5cffb7]/15 text-[#5cffb7] font-semibold border border-[#5cffb7]/30'
                      : 'text-[#91a2b8] hover:bg-[#162338]'
                  }`}
                >
                  <span className="text-[11px]">{dayNum}</span>
                  {hasClasses && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-[#5cffb7] mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Attendance Recording Card */}
        <div className="bg-[#090f19] p-4 rounded-2xl border border-[#202c3d]/50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-[10px] text-[#35d9ff] uppercase tracking-wider font-semibold">
                Record Attendance For
              </span>
              <p className="text-sm font-semibold text-[#edf5ff]">{selectedDateFormatted}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#162338] text-[#5cffb7] font-semibold">
                {completedStudentIds.length} of {students.length} Taught
              </span>
            </div>
          </div>

          <p className="text-[11px] text-[#91a2b8] leading-relaxed">
            Check students you taught on this date. Saved automatically and synchronized with each student's profile calendar.
          </p>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {students.length === 0 ? (
              <div className="text-center py-4 text-[#91a2b8] text-xs font-mono">
                No students added yet.
              </div>
            ) : (
              students.map(student => {
                const studentRecord = dateAttendance.find(a => a.studentId === student.id);
                const status = studentRecord ? studentRecord.status : 'unmarked';
                const isCompleted = status === 'completed';
                const isRescheduled = status === 'rescheduled';
                const isMissed = status === 'missed';

                return (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isCompleted
                        ? 'bg-[#5cffb7]/10 border-[#5cffb7]/40 text-[#edf5ff]'
                        : isRescheduled
                        ? 'bg-[#ffbf69]/10 border-[#ffbf69]/40'
                        : isMissed
                        ? 'bg-[#ff5c78]/10 border-[#ff5c78]/40'
                        : 'bg-[#0c1320] border-[#202c3d]/40 hover:bg-[#162338]'
                    }`}
                  >
                    {/* Left: Checkbox + Student Name & Info */}
                    <div
                      onClick={() => handleToggleAttendance(student.id)}
                      className="flex items-center space-x-2.5 min-w-0 pr-2 cursor-pointer flex-1 select-none"
                    >
                      <button
                        type="button"
                        aria-label={`Toggle attendance for ${student.name}`}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                          isCompleted
                            ? 'bg-[#5cffb7] text-[#070b12] shadow-[0_0_8px_#5cffb7]'
                            : isRescheduled
                            ? 'bg-[#ffbf69] text-[#070b12]'
                            : isMissed
                            ? 'bg-[#ff5c78] text-[#ffffff]'
                            : 'bg-[#162338] border border-[#202c3d] text-transparent hover:border-[#35d9ff]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px] font-bold">
                          {isCompleted ? 'check' : isRescheduled ? 'sync' : isMissed ? 'close' : 'check'}
                        </span>
                      </button>

                      <div className="min-w-0">
                        <h5 className="text-xs font-semibold text-[#edf5ff] truncate">
                          {student.name}
                        </h5>
                        <p className="font-mono text-[10px] text-[#91a2b8] truncate">
                          {student.gradeOrClass} • {student.preferredDays.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    </div>

                    {/* Right: Status Pill & Dropdown Switcher */}
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span
                        className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isCompleted
                            ? 'bg-[#5cffb7]/20 text-[#5cffb7]'
                            : isRescheduled
                            ? 'bg-[#ffbf69]/20 text-[#ffbf69]'
                            : isMissed
                            ? 'bg-[#ff5c78]/20 text-[#ff5c78]'
                            : 'bg-[#162338] text-[#91a2b8]'
                        }`}
                      >
                        {isCompleted
                          ? 'Completed'
                          : isRescheduled
                          ? 'Rescheduled'
                          : isMissed
                          ? 'Missed'
                          : 'Unmarked'}
                      </span>

                      <select
                        value={status}
                        onChange={e => handleSetStudentStatus(student.id, e.target.value as AttendanceStatus)}
                        className="bg-[#162338] border border-[#202c3d] rounded-lg px-1.5 py-1 text-[10px] font-mono text-[#91a2b8] focus:text-[#edf5ff] focus:outline-none"
                      >
                        <option value="unmarked">Unmarked</option>
                        <option value="completed">Completed</option>
                        <option value="rescheduled">Rescheduled</option>
                        <option value="missed">Missed</option>
                      </select>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-[#35d9ff] text-[#003641] font-semibold text-xs font-mono shadow-[0_0_16px_rgba(53,217,255,0.25)] active:scale-95 transition-all shrink-0"
        >
          Done
        </button>
      </motion.div>
    </div>
  );
};
