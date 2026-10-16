import React, { useState, useMemo } from 'react';
import { useApp, getLocalDateString } from '../../context/AppContext';
import { motion } from 'motion/react';
import { AttendanceStatus } from '../../types';

interface StudentProfileModalProps {
  studentId: string | null;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ studentId, onClose }) => {
  const {
    students,
    attendance,
    payments,
    addPayment,
    deletePayment,
    recordAttendance,
    removeAttendanceForDateStudent,
    updateStudent,
    deleteStudent,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'payments' | 'info'>('attendance');
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Month navigation in student calendar
  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  // Date picker modal for changing attendance on specific date
  const [statusPickerDate, setStatusPickerDate] = useState<string | null>(null);

  // Payment form states
  const [payAmount, setPayAmount] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(getLocalDateString());
  const [payMethod, setPayMethod] = useState<string>('bKash');
  const [payNotes, setPayNotes] = useState<string>('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const student = students.find(s => s.id === studentId);

  // Edit student form state prefilled with student data
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editFee, setEditFee] = useState<number>(5000);
  const [editTarget, setEditTarget] = useState<number>(16);
  const [editSubjects, setEditSubjects] = useState('');
  const [editDays, setEditDays] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editParentPhone, setEditParentPhone] = useState('');
  const [editAltPhone, setEditAltPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Synchronize edit fields when student changes or edit mode opens
  const initializeEditForm = () => {
    if (!student) return;
    setEditName(student.name);
    setEditPhone(student.phone || '');
    setEditGrade(student.gradeOrClass);
    setEditSchool(student.school || '');
    setEditFee(student.monthlyFee);
    setEditTarget(student.monthlyTarget || 16);
    setEditSubjects(student.subjects.join(', '));
    setEditDays(student.preferredDays.join(', '));
    setEditParentName(student.parentName || '');
    setEditParentPhone(student.parentPhone || '');
    setEditAltPhone(student.altPhone || '');
    setEditAddress(student.address || '');
    setEditNotes(student.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !editName.trim()) return;

    updateStudent(student.id, {
      name: editName.trim(),
      phone: editPhone.trim() || undefined,
      gradeOrClass: editGrade.trim() || 'Class 9',
      school: editSchool.trim() || undefined,
      monthlyFee: Number(editFee) || 5000,
      monthlyTarget: Number(editTarget) || 16,
      subjects: editSubjects.split(',').map(s => s.trim()).filter(Boolean),
      preferredDays: editDays.split(',').map(d => d.trim()).filter(Boolean),
      parentName: editParentName.trim() || undefined,
      parentPhone: editParentPhone.trim() || undefined,
      altPhone: editAltPhone.trim() || undefined,
      address: editAddress.trim() || undefined,
      notes: editNotes.trim() || undefined,
    });

    setIsEditingInfo(false);
  };

  if (!studentId || !student) return null;

  // Single source of truth: filter attendance for this student
  const studentAttendance = attendance.filter(a => a.studentId === student.id);
  const completedSessions = studentAttendance.filter(a => a.status === 'completed').length;
  const rescheduledSessions = studentAttendance.filter(a => a.status === 'rescheduled').length;
  const missedSessions = studentAttendance.filter(a => a.status === 'missed').length;

  const currentMonthStr = new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const yearMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const studentPayments = payments.filter(p => p.studentId === student.id);
  const paidThisMonth = studentPayments
    .filter(p => p.month === currentMonthStr || p.paymentDate.startsWith(yearMonthPrefix))
    .reduce((acc, p) => acc + p.amount, 0);

  const outstandingBalance = Math.max(0, student.monthlyFee - paidThisMonth);
  const progressPercent = Math.min(100, Math.round((completedSessions / (student.monthlyTarget || 16)) * 100));

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const daysGrid = [];
  for (let i = 0; i < firstDayIndex; i++) daysGrid.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysGrid.push(dStr);
  }

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

  const handleSetStatus = (dateStr: string, status: AttendanceStatus) => {
    if (status === 'unmarked') {
      removeAttendanceForDateStudent(dateStr, student.id);
    } else {
      recordAttendance(dateStr, [student.id], status);
    }
    setStatusPickerDate(null);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || amt <= 0) return;

    addPayment({
      studentId: student.id,
      studentName: student.name,
      amount: amt,
      paymentDate: payDate,
      month: currentMonthStr,
      status: amt >= outstandingBalance ? 'Paid' : 'Partial',
      method: payMethod,
      notes: payNotes.trim() || undefined,
    });

    setPayAmount('');
    setPayNotes('');
    setShowPaymentForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative z-10 w-full max-w-lg bg-[#0c1320] border-t sm:border border-[#202c3d]/60 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[92vh] flex flex-col space-y-4 overflow-y-auto"
      >
        <div className="w-12 h-1.5 bg-[#202c3d] rounded-full mx-auto" />

        {/* Student Top Summary Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#202c3d]/40">
          <div className="flex items-center space-x-3 min-w-0 pr-2">
            <div className="w-11 h-11 rounded-xl bg-[#162338] border border-[#35d9ff]/30 text-[#35d9ff] font-bold font-mono text-base flex items-center justify-center shadow-sm shrink-0">
              {student.initials}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-[#edf5ff] truncate">
                {student.name}
              </h3>
              <p className="text-xs text-[#91a2b8] truncate mt-0.5">
                {student.gradeOrClass} • {student.subjects.join(', ')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#162338] flex items-center justify-center text-[#91a2b8] hover:text-[#edf5ff] transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Subtabs: Attendance, Tuition Money, Student Info */}
        <div className="w-full bg-[#090f19] p-1 rounded-xl flex items-center font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('attendance')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeSubTab === 'attendance'
                ? 'bg-[#35d9ff] text-[#003641] font-bold shadow-sm'
                : 'text-[#91a2b8] hover:text-[#edf5ff]'
            }`}
          >
            Attendance
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('payments')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeSubTab === 'payments'
                ? 'bg-[#35d9ff] text-[#003641] font-bold shadow-sm'
                : 'text-[#91a2b8] hover:text-[#edf5ff]'
            }`}
          >
            Fees &amp; ৳ ({outstandingBalance > 0 ? `৳${outstandingBalance}` : 'Paid'})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('info');
              initializeEditForm();
            }}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              activeSubTab === 'info'
                ? 'bg-[#35d9ff] text-[#003641] font-bold shadow-sm'
                : 'text-[#91a2b8] hover:text-[#edf5ff]'
            }`}
          >
            Profile Info
          </button>
        </div>

        {/* ================= TAB 1: ATTENDANCE & INDIVIDUAL CALENDAR ================= */}
        {activeSubTab === 'attendance' && (
          <div className="space-y-3.5 overflow-y-auto max-h-[62vh] pr-1">
            {/* Class Progress Card */}
            <div className="bg-[#090f19] p-3.5 rounded-2xl border border-[#202c3d]/40 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#91a2b8]">Monthly Target</span>
                <span className="font-mono text-[#35d9ff] font-semibold">
                  {completedSessions} of {student.monthlyTarget || 16} Done ({progressPercent}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#1f314c] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#35d9ff] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#91a2b8] pt-1">
                <span className="text-[#5cffb7]">{student.attendanceRate ?? 100}% Attendance Rate</span>
                <span>{Math.max(0, (student.monthlyTarget || 16) - completedSessions)} Classes Remaining</span>
              </div>
            </div>

            {/* Attendance Legend */}
            <div className="flex items-center justify-between px-2 font-mono text-[10px] text-[#91a2b8]">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#5cffb7]" />
                <span>Completed</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#ffbf69]" />
                <span>Rescheduled</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#ff5c78]" />
                <span>Missed</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#1f314c]" />
                <span>Unmarked</span>
              </span>
            </div>

            {/* Individual Calendar Grid */}
            <div className="bg-[#090f19] p-3 rounded-2xl border border-[#202c3d]/40">
              {/* Calendar Month Navigation */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#202c3d]/30 font-mono text-xs">
                <span className="text-[#35d9ff] font-semibold">
                  {new Date(currentYear, currentMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded bg-[#162338] text-[#91a2b8] hover:text-[#edf5ff]"
                  >
                    <span className="material-symbols-outlined text-[15px]">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded bg-[#162338] text-[#91a2b8] hover:text-[#edf5ff]"
                  >
                    <span className="material-symbols-outlined text-[15px]">chevron_right</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] text-[#91a2b8] mb-1.5 uppercase">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
                {daysGrid.map((dateStr, idx) => {
                  if (!dateStr) return <div key={`empty-${idx}`} className="h-8" />;
                  const dayNum = parseInt(dateStr.split('-')[2], 10);
                  const att = studentAttendance.find(a => a.date === dateStr);

                  let bgClass = 'bg-[#0c1320] text-[#91a2b8] hover:bg-[#162338]';
                  if (att?.status === 'completed') {
                    bgClass = 'bg-[#5cffb7]/20 text-[#5cffb7] border border-[#5cffb7]/60 font-bold';
                  } else if (att?.status === 'rescheduled') {
                    bgClass = 'bg-[#ffbf69]/20 text-[#ffbf69] border border-[#ffbf69]/60 font-bold';
                  } else if (att?.status === 'missed') {
                    bgClass = 'bg-[#ff5c78]/20 text-[#ff5c78] border border-[#ff5c78]/60 font-bold';
                  }

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setStatusPickerDate(dateStr)}
                      title={`Tap to edit attendance on ${dateStr}`}
                      className={`h-8 rounded-lg flex flex-col items-center justify-center transition-all ${bgClass}`}
                    >
                      <span>{dayNum}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-[#91a2b8] text-center mt-2.5">
                Tap any date to mark as Completed, Rescheduled, Missed, or Unmarked.
              </p>
            </div>

            {/* Quick Status Picker Popup for a Selected Date */}
            {statusPickerDate && (
              <div className="p-3.5 rounded-xl bg-[#162338] border border-[#35d9ff]/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#edf5ff] font-semibold">
                    Set Status for {statusPickerDate}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatusPickerDate(null)}
                    className="text-[#91a2b8] hover:text-[#edf5ff]"
                  >
                    <span className="material-symbols-outlined text-[15px]">close</span>
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleSetStatus(statusPickerDate, 'completed')}
                    className="py-1.5 rounded-lg bg-[#5cffb7]/20 text-[#5cffb7] border border-[#5cffb7]/40 hover:bg-[#5cffb7]/30"
                  >
                    Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetStatus(statusPickerDate, 'rescheduled')}
                    className="py-1.5 rounded-lg bg-[#ffbf69]/20 text-[#ffbf69] border border-[#ffbf69]/40 hover:bg-[#ffbf69]/30"
                  >
                    Rescheduled
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetStatus(statusPickerDate, 'missed')}
                    className="py-1.5 rounded-lg bg-[#ff5c78]/20 text-[#ff5c78] border border-[#ff5c78]/40 hover:bg-[#ff5c78]/30"
                  >
                    Missed
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetStatus(statusPickerDate, 'unmarked')}
                    className="py-1.5 rounded-lg bg-[#0c1320] text-[#91a2b8] border border-[#202c3d] hover:text-[#edf5ff]"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: TUITION FEES & PAYMENTS ================= */}
        {activeSubTab === 'payments' && (
          <div className="space-y-3.5 overflow-y-auto max-h-[62vh] pr-1">
            {/* Financial Overview Card */}
            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              <div className="p-2.5 rounded-xl bg-[#090f19] border border-[#202c3d]/40">
                <span className="text-[9px] text-[#91a2b8] block uppercase">Monthly Fee</span>
                <span className="text-xs font-bold text-[#edf5ff] mt-0.5 block">
                  ৳{student.monthlyFee.toLocaleString()}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#090f19] border border-[#202c3d]/40">
                <span className="text-[9px] text-[#91a2b8] block uppercase">Paid This Mo</span>
                <span className="text-xs font-bold text-[#5cffb7] mt-0.5 block">
                  ৳{paidThisMonth.toLocaleString()}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#090f19] border border-[#202c3d]/40">
                <span className="text-[9px] text-[#91a2b8] block uppercase">Due Balance</span>
                <span className="text-xs font-bold text-[#ff5c78] mt-0.5 block">
                  ৳{outstandingBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Record Payment Trigger / Form */}
            {!showPaymentForm ? (
              <button
                type="button"
                onClick={() => {
                  setPayAmount(String(outstandingBalance > 0 ? outstandingBalance : student.monthlyFee));
                  setShowPaymentForm(true);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#05f292] to-[#35d9ff] text-[#003641] font-mono text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center space-x-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add_card</span>
                <span>Record Tuition Payment</span>
              </button>
            ) : (
              <form onSubmit={handleRecordPaymentSubmit} className="bg-[#090f19] p-3.5 rounded-2xl border border-[#202c3d]/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#35d9ff] font-semibold uppercase">
                    Record Payment (Partial or Full)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPaymentForm(false)}
                    className="text-xs text-[#91a2b8] hover:text-[#edf5ff]"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col space-y-1">
                    <label className="font-mono text-[10px] text-[#91a2b8]">AMOUNT (৳) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="font-mono text-[10px] text-[#91a2b8]">METHOD</label>
                    <select
                      value={payMethod}
                      onChange={e => setPayMethod(e.target.value)}
                      className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    >
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col space-y-1">
                    <label className="font-mono text-[10px] text-[#91a2b8]">PAYMENT DATE</label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={e => setPayDate(e.target.value)}
                      className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2 py-1 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="font-mono text-[10px] text-[#91a2b8]">REMARKS</label>
                    <input
                      type="text"
                      placeholder="Notes / Trx"
                      value={payNotes}
                      onChange={e => setPayNotes(e.target.value)}
                      className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2 py-1 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-[#35d9ff] text-[#003641] font-mono text-xs font-bold shadow-md hover:brightness-105 active:scale-95"
                >
                  Save Payment
                </button>
              </form>
            )}

            {/* Payment Receipts History */}
            <div className="space-y-2">
              <span className="font-mono text-[10px] text-[#91a2b8] uppercase tracking-wider block">
                Payment History ({studentPayments.length} Records)
              </span>

              {studentPayments.length === 0 ? (
                <p className="text-xs text-[#91a2b8] italic p-3 bg-[#090f19] rounded-xl border border-[#202c3d]/30 text-center">
                  No payment receipts recorded for this student yet.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {studentPayments.map(p => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg bg-[#090f19] border border-[#202c3d]/30 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <span className="text-[#edf5ff]">{p.paymentDate}</span>
                        <span className="text-[#91a2b8] ml-2">({p.method || 'bKash'})</span>
                        {p.notes && <span className="text-[#91a2b8] block text-[10px]">{p.notes}</span>}
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-[#5cffb7] font-semibold">
                          ৳{p.amount.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete payment of ৳${p.amount.toLocaleString()}?`)) {
                              deletePayment(p.id);
                            }
                          }}
                          className="text-[#91a2b8] hover:text-[#ff5c78]"
                          title="Delete payment"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: STUDENT PROFILE INFO & EDITING ================= */}
        {activeSubTab === 'info' && (
          <div className="space-y-3.5 overflow-y-auto max-h-[62vh] pr-1">
            {!isEditingInfo ? (
              <div className="space-y-3">
                {/* Details Card */}
                <div className="bg-[#090f19] p-3.5 rounded-2xl border border-[#202c3d]/40 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#202c3d]/30">
                    <span className="font-mono text-[10px] text-[#35d9ff] uppercase font-bold">
                      Student Details
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        initializeEditForm();
                        setIsEditingInfo(true);
                      }}
                      className="inline-flex items-center space-x-1 font-mono text-[10px] text-[#35d9ff] hover:underline"
                    >
                      <span className="material-symbols-outlined text-[13px]">edit</span>
                      <span>Edit Information</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-[#91a2b8] block">PHONE</span>
                      <span className="text-[#edf5ff] font-mono">{student.phone || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#91a2b8] block">CLASS / GRADE</span>
                      <span className="text-[#edf5ff]">{student.gradeOrClass}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-[#91a2b8] block">INSTITUTION</span>
                    <span className="text-[#edf5ff]">{student.school || 'Not specified'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-[#91a2b8] block">MONTHLY FEE</span>
                      <span className="text-[#5cffb7] font-mono font-bold">৳{student.monthlyFee.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#91a2b8] block">MONTHLY TARGET</span>
                      <span className="text-[#edf5ff] font-mono">{student.monthlyTarget || 16} Classes</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-[#91a2b8] block">SUBJECTS</span>
                    <span className="text-[#edf5ff]">{student.subjects.join(', ')}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-[#91a2b8] block">TEACHING DAYS</span>
                    <span className="text-[#edf5ff]">{student.preferredDays.join(', ')}</span>
                  </div>

                  {/* Guardian section */}
                  {(student.parentName || student.parentPhone || student.altPhone) && (
                    <div className="pt-2 border-t border-[#202c3d]/30 space-y-1.5">
                      <span className="font-mono text-[10px] text-[#cdbdff] uppercase font-bold block">
                        Parent &amp; Contacts
                      </span>
                      {student.parentName && (
                        <div>
                          <span className="text-[10px] font-mono text-[#91a2b8] block">PARENT / GUARDIAN</span>
                          <span className="text-[#edf5ff]">{student.parentName}</span>
                        </div>
                      )}
                      {student.parentPhone && (
                        <div>
                          <span className="text-[10px] font-mono text-[#91a2b8] block">PARENT PHONE</span>
                          <span className="text-[#edf5ff] font-mono">{student.parentPhone}</span>
                        </div>
                      )}
                      {student.altPhone && (
                        <div>
                          <span className="text-[10px] font-mono text-[#91a2b8] block">ALT CONTACT</span>
                          <span className="text-[#edf5ff] font-mono">{student.altPhone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {student.address && (
                    <div>
                      <span className="text-[10px] font-mono text-[#91a2b8] block">ADDRESS</span>
                      <span className="text-[#edf5ff]">{student.address}</span>
                    </div>
                  )}

                  {student.notes && (
                    <div className="pt-1.5 border-t border-[#202c3d]/30">
                      <span className="text-[10px] font-mono text-[#91a2b8] block">NOTES</span>
                      <p className="text-[#edf5ff] italic text-xs leading-relaxed">{student.notes}</p>
                    </div>
                  )}
                </div>

                {/* Destructive Action: Delete Student */}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${student.name}? This will remove their records.`)) {
                      deleteStudent(student.id);
                      onClose();
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#ff5c78]/10 text-[#ff5c78] border border-[#ff5c78]/30 font-mono text-xs font-semibold hover:bg-[#ff5c78]/20 transition-all flex items-center justify-center space-x-1"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_forever</span>
                  <span>Delete Student Record</span>
                </button>
              </div>
            ) : (
              /* Editable Profile Form */
              <form onSubmit={handleSaveEdit} className="bg-[#090f19] p-4 rounded-2xl border border-[#202c3d]/50 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-[#202c3d]/30">
                  <span className="font-mono text-xs text-[#35d9ff] uppercase font-bold">
                    Edit Student Profile
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo(false)}
                    className="text-xs text-[#91a2b8] hover:text-[#edf5ff]"
                  >
                    Cancel
                  </button>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-mono text-[#91a2b8]">FULL NAME *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-mono text-[#91a2b8]">PHONE NUMBER</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-mono text-[#91a2b8]">GRADE / CLASS</label>
                    <input
                      type="text"
                      value={editGrade}
                      onChange={e => setEditGrade(e.target.value)}
                      className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-mono text-[#91a2b8]">SCHOOL / COLLEGE</label>
                  <input
                    type="text"
                    value={editSchool}
                    onChange={e => setEditSchool(e.target.value)}
                    className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-mono text-[#91a2b8]">MONTHLY FEE (৳) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editFee}
                      onChange={e => setEditFee(Number(e.target.value))}
                      className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-mono text-[#91a2b8]">MONTHLY TARGET SESSIONS</label>
                    <input
                      type="number"
                      min={1}
                      value={editTarget}
                      onChange={e => setEditTarget(Number(e.target.value))}
                      className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-mono text-[#91a2b8]">SUBJECTS</label>
                    <input
                      type="text"
                      value={editSubjects}
                      onChange={e => setEditSubjects(e.target.value)}
                      className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-mono text-[#91a2b8]">TEACHING DAYS</label>
                    <input
                      type="text"
                      value={editDays}
                      onChange={e => setEditDays(e.target.value)}
                      className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>
                </div>

                {/* Parent info */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-mono text-[#91a2b8]">PARENT NAME</label>
                    <input
                      type="text"
                      value={editParentName}
                      onChange={e => setEditParentName(e.target.value)}
                      className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-mono text-[#91a2b8]">PARENT PHONE</label>
                    <input
                      type="tel"
                      value={editParentPhone}
                      onChange={e => setEditParentPhone(e.target.value)}
                      className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-mono text-[#91a2b8]">NOTES</label>
                  <textarea
                    rows={2}
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff] resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingInfo(false)}
                    className="px-3 py-1.5 font-mono text-xs text-[#91a2b8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#35d9ff] text-[#003641] font-mono text-xs font-bold shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
