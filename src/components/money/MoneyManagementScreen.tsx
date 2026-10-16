import React, { useState, useMemo } from 'react';
import { useApp, getLocalDateString } from '../../context/AppContext';
import { Student, TuitionPayment } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export const MoneyManagementScreen: React.FC = () => {
  const { students, payments, addPayment, deletePayment } = useApp();

  const [graphRange, setGraphRange] = useState<'6m' | '12m'>('6m');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);

  // Payment Form States
  const [payAmount, setPayAmount] = useState<string>('');
  const [payDate, setPayDate] = useState<string>(getLocalDateString());
  const [payMethod, setPayMethod] = useState<string>('bKash');
  const [payNotes, setPayNotes] = useState<string>('');
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string>('');

  // Current Date reference
  const now = new Date();
  const currentMonthName = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();

  // 1. Calculate Total Received & Still to Collect
  // Total Received is the sum of payments recorded this month
  const currentMonthStr = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); // e.g. "October 2026"

  const totalReceivedThisMonth = useMemo(() => {
    return payments
      .filter(p => p.month === currentMonthStr || p.paymentDate.startsWith(getLocalDateString().substring(0, 7)))
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments, currentMonthStr]);

  // Total Still to Collect is the sum of due amounts for active students
  const totalStillToCollect = useMemo(() => {
    return students.reduce((sum, s) => {
      // Calculate dues directly from student.monthlyFee - total payments this month for this student
      const studentPaidThisMonth = payments
        .filter(p => p.studentId === s.id && (p.month === currentMonthStr || p.paymentDate.startsWith(getLocalDateString().substring(0, 7))))
        .reduce((acc, p) => acc + p.amount, 0);
      const remaining = Math.max(0, s.monthlyFee - studentPaidThisMonth);
      return sum + remaining;
    }, 0);
  }, [students, payments, currentMonthStr]);

  const totalExpectedIncome = totalReceivedThisMonth + totalStillToCollect;
  const collectionRate = totalExpectedIncome > 0 ? Math.round((totalReceivedThisMonth / totalExpectedIncome) * 100) : 100;

  // 2. Build Income Graph Data for 6M / 12M
  const graphMonths = useMemo(() => {
    const monthCount = graphRange === '6m' ? 6 : 12;
    const list = [];

    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const shortLabel = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const yearMonthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      // Sum all payments in this month
      const monthPayments = payments.filter(
        p => p.month === mStr || p.paymentDate.startsWith(yearMonthPrefix)
      );
      const totalAmount = monthPayments.reduce((sum, p) => sum + p.amount, 0);

      list.push({
        label: shortLabel,
        fullMonth: mStr,
        yearMonth: yearMonthPrefix,
        total: totalAmount,
        payments: monthPayments,
      });
    }

    return list;
  }, [payments, graphRange, now]);

  // Max value in graph for proportional height scaling
  const maxMonthlyIncome = useMemo(() => {
    const maxVal = Math.max(...graphMonths.map(m => m.total), 10000);
    return maxVal;
  }, [graphMonths]);

  // Selected month data for summary breakdown
  const activeMonthData = selectedMonthIndex !== null && graphMonths[selectedMonthIndex]
    ? graphMonths[selectedMonthIndex]
    : graphMonths[graphMonths.length - 1]; // Default to latest month

  // 3. Students with unpaid fees list
  const unpaidStudents = useMemo(() => {
    return students
      .map(student => {
        const studentPaid = payments
          .filter(p => p.studentId === student.id && (p.month === currentMonthStr || p.paymentDate.startsWith(getLocalDateString().substring(0, 7))))
          .reduce((acc, p) => acc + p.amount, 0);
        const remaining = Math.max(0, student.monthlyFee - studentPaid);
        return {
          ...student,
          paidThisMonth: studentPaid,
          dueThisMonth: remaining,
        };
      })
      .filter(s => s.dueThisMonth > 0);
  }, [students, payments, currentMonthStr]);

  // Handle Recording a Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForPayment) return;

    const amountNum = Number(payAmount);
    if (!amountNum || amountNum <= 0) return;

    // Student's remaining due before this payment
    const studentPaidBefore = payments
      .filter(p => p.studentId === selectedStudentForPayment.id && (p.month === currentMonthStr || p.paymentDate.startsWith(getLocalDateString().substring(0, 7))))
      .reduce((acc, p) => acc + p.amount, 0);
    const dueBefore = Math.max(0, selectedStudentForPayment.monthlyFee - studentPaidBefore);

    const isFull = amountNum >= dueBefore;

    addPayment({
      studentId: selectedStudentForPayment.id,
      studentName: selectedStudentForPayment.name,
      amount: amountNum,
      paymentDate: payDate || getLocalDateString(),
      month: currentMonthStr,
      status: isFull ? 'Paid' : 'Partial',
      method: payMethod,
      notes: payNotes.trim() || undefined,
    });

    setPaymentSuccessToast(`Recorded ৳${amountNum.toLocaleString()} from ${selectedStudentForPayment.name}`);
    setTimeout(() => setPaymentSuccessToast(''), 3000);

    setPayAmount('');
    setPayNotes('');
    setSelectedStudentForPayment(null);
  };

  return (
    <main className="flex flex-col relative w-full px-4 pt-header-safe pb-32 bg-[#070b12] min-h-screen text-[#edf5ff]">
      {/* Toast Notification */}
      <AnimatePresence>
        {paymentSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 inset-x-4 z-50 max-w-sm mx-auto bg-[#05f292]/15 border border-[#05f292]/60 text-[#05f292] px-4 py-2.5 rounded-xl shadow-[0_0_16px_rgba(5,242,146,0.3)] flex items-center space-x-2 text-xs font-mono backdrop-blur-xl"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{paymentSuccessToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col w-full space-y-5">
        {/* Top Header Telemetry */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#05f292] shadow-[0_0_8px_#05f292] animate-ping" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#35d9ff]">
              TUITION LEDGER // BDT
            </span>
          </div>

          <span className="font-mono text-xs text-[#91a2b8]">
            {currentMonthName}
          </span>
        </div>

        {/* SECTION A: Total Received & Still to Collect Cards */}
        <section className="grid grid-cols-2 gap-3">
          {/* Total Received Card */}
          <div className="relative rounded-2xl bg-[#0c1320] p-4 border border-[#202c3d]/60 shadow-lg overflow-hidden group hover:border-[#05f292]/40 transition-all">
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-[#05f292]/10 blur-xl pointer-events-none" />
            <div className="relative z-10 flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#91a2b8] uppercase tracking-wider font-semibold">
                  Total Received
                </span>
                <div className="w-6 h-6 rounded-lg bg-[#05f292]/15 text-[#05f292] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[15px]">arrow_downward</span>
                </div>
              </div>

              <div className="flex items-baseline space-x-1 font-mono pt-1">
                <span className="text-sm font-semibold text-[#05f292]">৳</span>
                <span className="text-2xl font-bold text-[#05f292] tracking-tight drop-shadow-[0_0_10px_rgba(5,242,146,0.25)]">
                  {totalReceivedThisMonth.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#05f292]" />
                <span className="font-mono text-[10px] text-[#91a2b8]">
                  {collectionRate}% Collected
                </span>
              </div>
            </div>
          </div>

          {/* Still to Collect Card */}
          <div className="relative rounded-2xl bg-[#0c1320] p-4 border border-[#202c3d]/60 shadow-lg overflow-hidden group hover:border-[#ff5370]/40 transition-all">
            <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-[#ff5370]/10 blur-xl pointer-events-none" />
            <div className="relative z-10 flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#91a2b8] uppercase tracking-wider font-semibold">
                  Still to Collect
                </span>
                <div className="w-6 h-6 rounded-lg bg-[#ff5370]/15 text-[#ff5370] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[15px]">schedule</span>
                </div>
              </div>

              <div className="flex items-baseline space-x-1 font-mono pt-1">
                <span className="text-sm font-semibold text-[#ff5370]">৳</span>
                <span className="text-2xl font-bold text-[#ff5370] tracking-tight drop-shadow-[0_0_10px_rgba(255,83,112,0.25)]">
                  {totalStillToCollect.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center space-x-1.5 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff5370]" />
                <span className="font-mono text-[10px] text-[#91a2b8]">
                  {unpaidStudents.length} Students Pending
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION B: Simple Income Graph */}
        <section className="bg-[#0c1320] rounded-2xl p-4 border border-[#202c3d]/50 shadow-md space-y-3.5">
          {/* Header & 6M / 12M Range Switcher */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#edf5ff]">Income Graph</h3>
              <p className="font-mono text-[10px] text-[#91a2b8]">Tap a bar to inspect receipts</p>
            </div>

            <div className="bg-[#090f19] p-0.5 rounded-xl border border-[#202c3d]/40 flex items-center font-mono text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setGraphRange('6m');
                  setSelectedMonthIndex(null);
                }}
                className={`px-3 py-1 rounded-lg transition-all font-semibold ${
                  graphRange === '6m'
                    ? 'bg-[#35d9ff] text-[#003641] shadow-sm'
                    : 'text-[#91a2b8] hover:text-[#edf5ff]'
                }`}
              >
                6M
              </button>
              <button
                type="button"
                onClick={() => {
                  setGraphRange('12m');
                  setSelectedMonthIndex(null);
                }}
                className={`px-3 py-1 rounded-lg transition-all font-semibold ${
                  graphRange === '12m'
                    ? 'bg-[#35d9ff] text-[#003641] shadow-sm'
                    : 'text-[#91a2b8] hover:text-[#edf5ff]'
                }`}
              >
                12M
              </button>
            </div>
          </div>

          {/* Bar Chart Area */}
          <div className="h-40 w-full pt-4 pb-1 flex items-end justify-between gap-2 border-b border-[#202c3d]/30">
            {graphMonths.map((m, idx) => {
              const isSelected = selectedMonthIndex === idx || (selectedMonthIndex === null && idx === graphMonths.length - 1);
              const heightPct = Math.max(6, Math.min(100, Math.round((m.total / maxMonthlyIncome) * 100)));

              return (
                <div
                  key={m.yearMonth}
                  onClick={() => setSelectedMonthIndex(idx)}
                  className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                >
                  {/* Amount tooltip on hover/select */}
                  {isSelected && (
                    <span className="font-mono text-[9px] text-[#05f292] font-semibold mb-1 whitespace-nowrap">
                      ৳{m.total >= 1000 ? `${(m.total / 1000).toFixed(1)}k` : m.total}
                    </span>
                  )}

                  {/* Visual Bar */}
                  <div className="w-full max-w-[28px] h-full flex items-end">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        isSelected
                          ? 'bg-gradient-to-t from-[#05f292] to-[#35d9ff] shadow-[0_0_12px_rgba(5,242,146,0.35)]'
                          : m.total > 0
                          ? 'bg-[#1f314c] hover:bg-[#35d9ff]/50'
                          : 'bg-[#162338]/40'
                      }`}
                    />
                  </div>

                  {/* Month Label */}
                  <span
                    className={`font-mono text-[9px] mt-2 ${
                      isSelected ? 'text-[#35d9ff] font-bold' : 'text-[#91a2b8]'
                    }`}
                  >
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Month Summary Card (Shown when a month is selected) */}
          {activeMonthData && (
            <div className="bg-[#090f19] p-3 rounded-xl border border-[#202c3d]/40 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-[#91a2b8] uppercase">
                  {activeMonthData.fullMonth} Summary
                </span>
                <p className="font-mono text-sm font-bold text-[#edf5ff] mt-0.5">
                  ৳{activeMonthData.total.toLocaleString()} Collected
                </p>
              </div>

              <span className="font-mono text-[11px] text-[#35d9ff] px-2.5 py-1 rounded-full bg-[#162338] border border-[#202c3d]">
                {activeMonthData.payments.length} Payments Recorded
              </span>
            </div>
          )}
        </section>

        {/* SECTION C: Unpaid Fees List */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-semibold text-[#edf5ff]">Unpaid Fees</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#ff5370]/15 text-[#ff5370] font-mono text-[10px] font-semibold border border-[#ff5370]/30">
                {unpaidStudents.length} Students
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#91a2b8]">Tap to record payment</span>
          </div>

          {unpaidStudents.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#0c1320] border border-[#202c3d]/40 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#05f292]/15 text-[#05f292] mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">check_circle</span>
              </div>
              <h4 className="text-sm font-semibold text-[#edf5ff]">All Fees Settled</h4>
              <p className="text-xs text-[#91a2b8] max-w-xs mx-auto">
                No students have outstanding tuition fees for this billing cycle.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {unpaidStudents.map(student => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudentForPayment(student)}
                  className="p-3.5 rounded-2xl bg-[#0c1320] border border-[#202c3d]/50 hover:border-[#35d9ff]/40 transition-all flex items-center justify-between cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div className="w-10 h-10 rounded-xl bg-[#162338] border border-[#35d9ff]/30 text-[#35d9ff] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {student.initials}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-[#edf5ff] truncate">
                        {student.name}
                      </h4>
                      <p className="font-mono text-[10px] text-[#91a2b8] truncate mt-0.5">
                        {student.gradeOrClass} • Fee ৳{student.monthlyFee.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Due amount badge */}
                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-mono text-xs font-bold text-[#ff5370]">
                      ৳{student.dueThisMonth.toLocaleString()} Due
                    </span>
                    {student.paidThisMonth > 0 && (
                      <span className="font-mono text-[9px] text-[#05f292]">
                        ৳{student.paidThisMonth.toLocaleString()} Paid
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SECTION D: Recent Payment History Log */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-semibold text-[#edf5ff]">Recent Payments</h3>
            <span className="font-mono text-[10px] text-[#91a2b8]">All records</span>
          </div>

          {payments.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#0c1320] border border-[#202c3d]/40 text-center space-y-1.5">
              <p className="text-xs text-[#91a2b8]">No payments recorded yet.</p>
              <p className="text-[11px] text-[#91a2b8]/70">
                Tap on an unpaid student above to record full or partial tuition fees.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
              {payments.slice(0, 10).map(payment => {
                const student = students.find(s => s.id === payment.studentId);
                const sName = student?.name || payment.studentName || 'Student';

                return (
                  <div
                    key={payment.id}
                    className="p-3 rounded-xl bg-[#0c1320] border border-[#202c3d]/40 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <div className="w-8 h-8 rounded-lg bg-[#05f292]/15 text-[#05f292] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#edf5ff] truncate">{sName}</p>
                        <p className="font-mono text-[10px] text-[#91a2b8] truncate">
                          {payment.paymentDate} • {payment.method || 'bKash'}
                          {payment.notes ? ` • ${payment.notes}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="font-mono text-xs font-bold text-[#05f292]">
                        +৳{payment.amount.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete payment of ৳${payment.amount.toLocaleString()} for ${sName}?`)) {
                            deletePayment(payment.id);
                          }
                        }}
                        className="text-[#91a2b8] hover:text-[#ff5370] p-1 transition-colors"
                        title="Delete receipt"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* PAYMENT MODAL / PANEL */}
      <AnimatePresence>
        {selectedStudentForPayment && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedStudentForPayment(null)}
            />

            {/* Modal Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative z-10 w-full max-w-lg bg-[#0c1320] border-t sm:border border-[#202c3d]/60 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] flex flex-col space-y-4 overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-[#202c3d] rounded-full mx-auto" />

              {/* Student Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#202c3d]/40">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#162338] border border-[#35d9ff]/30 text-[#35d9ff] font-bold font-mono text-sm flex items-center justify-center">
                    {selectedStudentForPayment.initials}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#edf5ff]">
                      {selectedStudentForPayment.name}
                    </h3>
                    <p className="font-mono text-xs text-[#91a2b8]">
                      {selectedStudentForPayment.gradeOrClass} • {selectedStudentForPayment.phone || 'No phone'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStudentForPayment(null)}
                  className="w-8 h-8 rounded-full bg-[#162338] flex items-center justify-center text-[#91a2b8] hover:text-[#edf5ff]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Financial Status Pods */}
              {(() => {
                const studentPayments = payments.filter(p => p.studentId === selectedStudentForPayment.id);
                const totalPaidAllTime = studentPayments.reduce((sum, p) => sum + p.amount, 0);

                const studentPaidThisMonth = payments
                  .filter(p => p.studentId === selectedStudentForPayment.id && (p.month === currentMonthStr || p.paymentDate.startsWith(getLocalDateString().substring(0, 7))))
                  .reduce((acc, p) => acc + p.amount, 0);
                const remainingDue = Math.max(0, selectedStudentForPayment.monthlyFee - studentPaidThisMonth);

                return (
                  <>
                    <div className="grid grid-cols-3 gap-2 font-mono text-center">
                      <div className="p-2.5 rounded-xl bg-[#090f19] border border-[#202c3d]/40">
                        <span className="text-[9px] text-[#91a2b8] block uppercase">Monthly Fee</span>
                        <span className="text-xs font-bold text-[#edf5ff] mt-0.5 block">
                          ৳{selectedStudentForPayment.monthlyFee.toLocaleString()}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#090f19] border border-[#202c3d]/40">
                        <span className="text-[9px] text-[#91a2b8] block uppercase">Total Received</span>
                        <span className="text-xs font-bold text-[#05f292] mt-0.5 block">
                          ৳{studentPaidThisMonth.toLocaleString()}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#090f19] border border-[#202c3d]/40">
                        <span className="text-[9px] text-[#91a2b8] block uppercase">Remaining Due</span>
                        <span className="text-xs font-bold text-[#ff5370] mt-0.5 block">
                          ৳{remainingDue.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Record Payment Form */}
                    <form onSubmit={handleRecordPayment} className="bg-[#090f19] p-4 rounded-2xl border border-[#202c3d]/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-[#35d9ff] font-semibold uppercase">
                          Record New Payment
                        </span>
                        {remainingDue > 0 && (
                          <div className="flex space-x-1 font-mono text-[10px]">
                            <button
                              type="button"
                              onClick={() => setPayAmount(String(remainingDue))}
                              className="px-2 py-0.5 rounded bg-[#162338] text-[#05f292] hover:bg-[#1f314c]"
                            >
                              Full (৳{remainingDue.toLocaleString()})
                            </button>
                            <button
                              type="button"
                              onClick={() => setPayAmount(String(Math.round(remainingDue / 2)))}
                              className="px-2 py-0.5 rounded bg-[#162338] text-[#35d9ff] hover:bg-[#1f314c]"
                            >
                              Half
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col space-y-1">
                          <label className="font-mono text-[10px] text-[#91a2b8]">AMOUNT (৳) *</label>
                          <input
                            type="number"
                            required
                            min={1}
                            placeholder="e.g. 2000"
                            value={payAmount}
                            onChange={e => setPayAmount(e.target.value)}
                            className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                          />
                        </div>

                        <div className="flex flex-col space-y-1">
                          <label className="font-mono text-[10px] text-[#91a2b8]">PAYMENT METHOD</label>
                          <select
                            value={payMethod}
                            onChange={e => setPayMethod(e.target.value)}
                            className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-2.5 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                          >
                            <option value="bKash">bKash</option>
                            <option value="Nagad">Nagad</option>
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Rocket">Rocket</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="flex flex-col space-y-1">
                          <label className="font-mono text-[10px] text-[#91a2b8]">PAYMENT DATE</label>
                          <input
                            type="date"
                            value={payDate}
                            onChange={e => setPayDate(e.target.value)}
                            className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                          />
                        </div>

                        <div className="flex flex-col space-y-1">
                          <label className="font-mono text-[10px] text-[#91a2b8]">NOTES (OPTIONAL)</label>
                          <input
                            type="text"
                            placeholder="e.g. Trx ID or remarks"
                            value={payNotes}
                            onChange={e => setPayNotes(e.target.value)}
                            className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#05f292] to-[#35d9ff] text-[#003641] font-bold text-xs font-mono shadow-md hover:brightness-105 active:scale-95 transition-all"
                      >
                        Record Payment
                      </button>
                    </form>

                    {/* Student Payment History */}
                    <div className="space-y-2">
                      <span className="font-mono text-[10px] text-[#91a2b8] uppercase tracking-wider block">
                        Payment History ({studentPayments.length} Records)
                      </span>

                      {studentPayments.length === 0 ? (
                        <p className="text-xs text-[#91a2b8] italic">No prior payments recorded for this student.</p>
                      ) : (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {studentPayments.map(p => (
                            <div
                              key={p.id}
                              className="p-2 rounded-lg bg-[#090f19] border border-[#202c3d]/30 flex items-center justify-between text-xs font-mono"
                            >
                              <div>
                                <span className="text-[#edf5ff]">{p.paymentDate}</span>
                                <span className="text-[#91a2b8] ml-2">({p.method || 'bKash'})</span>
                                {p.notes && <span className="text-[#91a2b8] block text-[10px]">{p.notes}</span>}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[#05f292] font-semibold">
                                  ৳{p.amount.toLocaleString()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Delete this payment of ৳${p.amount.toLocaleString()}?`)) {
                                      deletePayment(p.id);
                                    }
                                  }}
                                  className="text-[#91a2b8] hover:text-[#ff5370]"
                                >
                                  <span className="material-symbols-outlined text-[14px]">delete</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};
