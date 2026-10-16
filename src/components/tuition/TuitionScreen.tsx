import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StudentProfileModal } from './StudentProfileModal';
import { OverallCalendarModal } from './OverallCalendarModal';
import { motion, AnimatePresence } from 'motion/react';

export const TuitionScreen: React.FC = () => {
  const {
    students,
    attendance,
    selectedStudentProfileId,
    setSelectedStudentProfileId,
    isCalendarModalOpen,
    setIsCalendarModalOpen,
    addStudent,
  } = useApp();

  const [attendanceSaveNotice, setAttendanceSaveNotice] = useState<string>('');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // New Student Form States (Required & Optional fields)
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formGrade, setFormGrade] = useState('');
  const [formFee, setFormFee] = useState<number>(5000);
  const [formSubjects, setFormSubjects] = useState('Physics, Math');
  const [formDays, setFormDays] = useState('Mon, Wed, Fri');
  const [formSchool, setFormSchool] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formAltPhone, setFormAltPhone] = useState('');
  const [formTarget, setFormTarget] = useState<number>(16);
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const triggerSaveNotice = (msg: string) => {
    setAttendanceSaveNotice(msg);
    setTimeout(() => {
      setAttendanceSaveNotice('');
    }, 2500);
  };

  // Add new student handler
  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    addStudent({
      name: formName.trim(),
      phone: formPhone.trim() || undefined,
      gradeOrClass: formGrade.trim() || 'Class 9',
      monthlyFee: Number(formFee) || 5000,
      subjects: formSubjects.split(',').map(s => s.trim()).filter(Boolean),
      preferredDays: formDays.split(',').map(d => d.trim()).filter(Boolean),
      school: formSchool.trim() || undefined,
      parentName: formParentName.trim() || undefined,
      parentPhone: formParentPhone.trim() || undefined,
      altPhone: formAltPhone.trim() || undefined,
      monthlyTarget: Number(formTarget) || 16,
      address: formAddress.trim() || undefined,
      notes: formNotes.trim() || undefined,
    });

    // Reset form
    setFormName('');
    setFormPhone('');
    setFormGrade('');
    setFormFee(5000);
    setFormSubjects('Physics, Math');
    setFormDays('Mon, Wed, Fri');
    setFormSchool('');
    setFormParentName('');
    setFormParentPhone('');
    setFormAltPhone('');
    setFormAddress('');
    setFormNotes('');
    setShowAddStudentModal(false);

    triggerSaveNotice('Student added successfully.');
  };

  // Total classes targets
  const totalClassesTarget = students.reduce((sum, s) => sum + s.monthlyTarget, 0);
  const totalClassesDone = attendance.filter(a => a.status === 'completed').length;

  return (
    <main className="flex flex-col relative w-full px-4 pt-header-safe pb-32 bg-[#070b12] min-h-screen text-[#edf5ff]">
      {/* Real-time Save Toast Indicator */}
      <AnimatePresence>
        {attendanceSaveNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 inset-x-4 z-50 max-w-sm mx-auto bg-[#0c1320]/95 border border-[#35d9ff]/50 text-[#35d9ff] px-4 py-2.5 rounded-xl shadow-[0_0_16px_rgba(53,217,255,0.25)] flex items-center space-x-2 text-xs font-mono backdrop-blur-xl"
          >
            <span className="material-symbols-outlined text-[17px] text-[#5cffb7]">check_circle</span>
            <span className="truncate">{attendanceSaveNotice}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col w-full space-y-5">
        {/* Top Telemetry Subheader */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#5cffb7] shadow-[0_0_8px_#5cffb7] animate-pulse" />
            <span className="font-mono text-xs text-[#edf5ff] font-semibold">
              {students.length} Active Students
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs text-[#91a2b8]">
              <span className="text-[#35d9ff] font-semibold">{totalClassesDone}</span> of {totalClassesTarget} Classes Done
            </span>
            <button
              type="button"
              onClick={() => setIsCalendarModalOpen(true)}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-[#162338] hover:bg-[#1f314c] text-[#35d9ff] border border-[#35d9ff]/30 text-xs font-mono font-medium active:scale-95 transition-all shadow-sm"
              title="Open Overall Tuition Calendar"
            >
              <span className="material-symbols-outlined text-[15px]">calendar_month</span>
              <span>Calendar</span>
            </button>
          </div>
        </div>

        {/* ================= ACTIVE STUDENTS LIST SECTION ================= */}
        <section className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-[#edf5ff] tracking-tight">Active Students</h2>
              <span className="bg-[#162338] px-2 py-0.5 rounded-full font-mono text-[10px] text-[#35d9ff]">
                {students.length} Total
              </span>
            </div>

            <button
              onClick={() => setShowAddStudentModal(true)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#35d9ff] text-[#003641] font-mono text-xs font-semibold shadow-md active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>Add Student</span>
            </button>
          </div>

          {students.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0c1320] border border-[#202c3d]/50 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#162338] text-[#35d9ff] mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">school</span>
              </div>
              <h4 className="text-base font-semibold text-[#edf5ff]">No students added yet</h4>
              <p className="text-xs text-[#91a2b8] max-w-xs mx-auto">
                Add your tuition students with their class, monthly fees in ৳, and teaching schedule to begin tracking.
              </p>
              <button
                type="button"
                onClick={() => setShowAddStudentModal(true)}
                className="px-4 py-2 rounded-xl bg-[#35d9ff] text-[#003641] font-mono text-xs font-bold shadow-md"
              >
                + Add Your First Student
              </button>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              {students.map(student => {
                const studentAttendance = attendance.filter(a => a.studentId === student.id);
                const completedCount = studentAttendance.filter(a => a.status === 'completed').length;
                const progressPercent = Math.min(
                  100,
                  Math.round((completedCount / (student.monthlyTarget || 16)) * 100)
                );
                const isPending = student.paymentStatus === 'Pending' || student.dueAmount > 0;

                return (
                  <article
                    key={student.id}
                    className="bg-[#0c1320] rounded-2xl p-4 border border-[#202c3d]/50 shadow-md flex flex-col space-y-3 hover:border-[#35d9ff]/30 transition-all"
                  >
                    {/* Top Row: Initials, Name, Grade & Payment Badge */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 min-w-0 pr-2">
                        <div className="w-10 h-10 rounded-xl bg-[#162338] border border-[#35d9ff]/30 text-[#35d9ff] font-mono font-bold text-sm flex items-center justify-center shrink-0">
                          {student.initials}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-[#edf5ff] truncate">
                            {student.name}
                          </h4>
                          <p className="font-mono text-xs text-[#91a2b8] truncate mt-0.5">
                            {student.gradeOrClass} • {student.preferredDays.slice(0, 3).join(', ')}
                          </p>
                        </div>
                      </div>

                      {/* Payment Due Status Pill */}
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold ${
                          isPending
                            ? 'bg-[#93000a]/20 text-[#ffb4ab] border border-[#ff5c78]/30 shadow-[0_0_8px_rgba(255,92,120,0.15)]'
                            : 'bg-[#5cffb7]/15 text-[#5cffb7] border border-[#5cffb7]/30'
                        }`}
                      >
                        {isPending
                          ? `৳${(student.dueAmount || student.monthlyFee).toLocaleString()} Pending`
                          : `৳${student.monthlyFee.toLocaleString()} Paid`}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-[#91a2b8]">
                          Classes: <span className="text-[#edf5ff] font-semibold">{completedCount} of {student.monthlyTarget}</span>
                        </span>
                        <span className="text-[#35d9ff] font-semibold">{progressPercent}%</span>
                      </div>

                      <div className="w-full h-1.5 bg-[#1f314c] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#35d9ff] transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Contact & Attendance Telemetry */}
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#91a2b8]">
                      <span>{student.phone || student.school || 'Schedule set'}</span>
                      <span className="text-[#5cffb7]">{student.attendanceRate ?? 100}% Attendance</span>
                    </div>

                    {/* View Profile Action */}
                    <button
                      type="button"
                      onClick={() => setSelectedStudentProfileId(student.id)}
                      className="w-full py-2.5 rounded-xl bg-[#162338] hover:bg-[#1f314c] text-[#edf5ff] font-mono text-xs font-medium flex items-center justify-center space-x-1.5 active:scale-[0.99] transition-all"
                    >
                      <span>View Profile &amp; Individual Calendar</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ================= ADD STUDENT MODAL (COMPREHENSIVE) ================= */}
      <AnimatePresence>
        {showAddStudentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowAddStudentModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-lg bg-[#0c1320] border border-[#202c3d]/80 rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#202c3d]/50 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-[#35d9ff]/20 text-[#35d9ff] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                  </div>
                  <h3 className="text-base font-bold text-[#edf5ff]">Add New Student</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="w-8 h-8 rounded-full bg-[#162338] text-[#91a2b8] hover:text-[#edf5ff] flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <form onSubmit={handleCreateStudent} className="space-y-4">
                {/* 1. Core Required Fields */}
                <div className="space-y-3">
                  <span className="font-mono text-[10px] text-[#35d9ff] uppercase font-bold tracking-wider">
                    Core Information (Required)
                  </span>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#91a2b8]">STUDENT NAME *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ahnaf Sakib"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#91a2b8]">GRADE / CLASS *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Class 10 / HSC 27"
                        value={formGrade}
                        onChange={e => setFormGrade(e.target.value)}
                        className="w-full bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#91a2b8]">MONTHLY FEE (৳) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="500"
                        placeholder="e.g. 5000"
                        value={formFee}
                        onChange={e => setFormFee(Number(e.target.value))}
                        className="w-full bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#91a2b8]">SUBJECTS *</label>
                      <input
                        type="text"
                        required
                        placeholder="Physics, Math"
                        value={formSubjects}
                        onChange={e => setFormSubjects(e.target.value)}
                        className="w-full bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#91a2b8]">MONTHLY CLASSES TARGET *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="31"
                        value={formTarget}
                        onChange={e => setFormTarget(Number(e.target.value))}
                        className="w-full bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#91a2b8]">SCHEDULE DAYS *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mon, Wed, Fri"
                      value={formDays}
                      onChange={e => setFormDays(e.target.value)}
                      className="w-full bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>
                </div>

                {/* 2. Optional Details (Collapsible feel) */}
                <div className="space-y-3 pt-2 border-t border-[#202c3d]/40">
                  <span className="font-mono text-[10px] text-[#91a2b8] uppercase font-bold tracking-wider">
                    Optional Contact &amp; Institution Details
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#91a2b8]">PHONE NUMBER</label>
                      <input
                        type="tel"
                        placeholder="017XXXXXXXX"
                        value={formPhone}
                        onChange={e => setFormPhone(e.target.value)}
                        className="w-full bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#91a2b8]">SCHOOL / COLLEGE</label>
                      <input
                        type="text"
                        placeholder="e.g. Dhaka College"
                        value={formSchool}
                        onChange={e => setFormSchool(e.target.value)}
                        className="w-full bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#91a2b8]">GUARDIAN NAME</label>
                      <input
                        type="text"
                        placeholder="e.g. Mother / Father"
                        value={formParentName}
                        onChange={e => setFormParentName(e.target.value)}
                        className="w-full bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#91a2b8]">GUARDIAN PHONE</label>
                      <input
                        type="tel"
                        placeholder="018XXXXXXXX"
                        value={formParentPhone}
                        onChange={e => setFormParentPhone(e.target.value)}
                        className="w-full bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#91a2b8]">EMERGENCY / ALT PHONE</label>
                      <input
                        type="tel"
                        placeholder="Optional backup"
                        value={formAltPhone}
                        onChange={e => setFormAltPhone(e.target.value)}
                        className="w-full bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#91a2b8]">ADDRESS / AREA</label>
                      <input
                        type="text"
                        placeholder="e.g. Dhanmondi, Rd 8"
                        value={formAddress}
                        onChange={e => setFormAddress(e.target.value)}
                        className="w-full bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-mono text-[#91a2b8]">NOTES</label>
                    <textarea
                      rows={2}
                      placeholder="Special focus topics, exam goals..."
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff] resize-none"
                    />
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="px-4 py-2 font-mono text-xs text-[#91a2b8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#35d9ff] to-[#5cffb7] text-[#003641] font-bold text-xs font-mono shadow-md active:scale-95 transition-all"
                  >
                    Save Student
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Individual Student Profile Modal */}
      <StudentProfileModal
        studentId={selectedStudentProfileId}
        onClose={() => setSelectedStudentProfileId(null)}
      />

      {/* Overall Tuition Calendar Modal (Triggered by Top Bar or Subheader button) */}
      <OverallCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
      />
    </main>
  );
};
