import React, { useState, useMemo } from 'react';
import { useApp, getLocalDateString } from '../../context/AppContext';
import { TransactionItem, TransactionType } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../../utils/haptics';

export const MoneyManagementScreen: React.FC = () => {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    students,
    payments,
  } = useApp();

  // Active filter tab: 'all' | 'income' | 'expense'
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionItem | null>(null);

  const [txType, setTxType] = useState<TransactionType>('income');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txCategory, setTxCategory] = useState<string>('Tuition Received');
  const [txDate, setTxDate] = useState<string>(getLocalDateString());
  const [txDescription, setTxDescription] = useState<string>('');
  const [txPaymentMethod, setTxPaymentMethod] = useState<string>('bKash');

  // Delete undo state
  const [deletedTxNotice, setDeletedTxNotice] = useState<TransactionItem | null>(null);

  // Common preset categories
  const INCOME_CATEGORIES = ['Tuition Received', 'Freelance', 'Salary', 'Allowance', 'Gift', 'Other Income'];
  const EXPENSE_CATEGORIES = ['Food & Dining', 'Transportation', 'Books & Study', 'Shopping', 'Gym & Fitness', 'Utilities', 'Other Expense'];

  // Current month reference
  const now = new Date();
  const currentMonthStr = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();

  // Financial calculations from saved manual transactions
  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const balance = totalIncome - totalExpense;

  // Filtered transactions list
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCat = t.category.toLowerCase().includes(q);
          const matchDesc = t.description?.toLowerCase().includes(q);
          const matchMethod = t.paymentMethod?.toLowerCase().includes(q);
          return matchCat || matchDesc || matchMethod;
        }
        return true;
      })
      .sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
  }, [transactions, filterType, searchQuery]);

  // Open modal for new transaction
  const handleOpenAdd = (type: TransactionType = 'income') => {
    triggerHaptic('light');
    setEditingTx(null);
    setTxType(type);
    setTxAmount('');
    setTxCategory(type === 'income' ? 'Tuition Received' : 'Food & Dining');
    setTxDate(getLocalDateString());
    setTxDescription('');
    setTxPaymentMethod('bKash');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (tx: TransactionItem) => {
    triggerHaptic('light');
    setEditingTx(tx);
    setTxType(tx.type);
    setTxAmount(String(tx.amount));
    setTxCategory(tx.category);
    setTxDate(tx.date);
    setTxDescription(tx.description || '');
    setTxPaymentMethod(tx.paymentMethod || 'bKash');
    setIsModalOpen(true);
  };

  // Submit Add or Edit
  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(txAmount);
    if (!amountNum || amountNum <= 0) return;

    if (editingTx) {
      updateTransaction(editingTx.id, {
        type: txType,
        amount: amountNum,
        category: txCategory.trim() || (txType === 'income' ? 'Income' : 'Expense'),
        date: txDate || getLocalDateString(),
        description: txDescription.trim() || undefined,
        paymentMethod: txPaymentMethod,
      });
      triggerHaptic('success');
    } else {
      addTransaction({
        type: txType,
        amount: amountNum,
        category: txCategory.trim() || (txType === 'income' ? 'Income' : 'Expense'),
        date: txDate || getLocalDateString(),
        description: txDescription.trim() || undefined,
        paymentMethod: txPaymentMethod,
      });
      triggerHaptic('success');
    }

    setIsModalOpen(false);
  };

  // Delete transaction with undo
  const handleDeleteTx = (tx: TransactionItem) => {
    triggerHaptic('warning');
    deleteTransaction(tx.id);
    setDeletedTxNotice(tx);
    setTimeout(() => {
      setDeletedTxNotice(null);
    }, 4500);
  };

  const handleUndoDelete = () => {
    if (deletedTxNotice) {
      addTransaction({
        type: deletedTxNotice.type,
        amount: deletedTxNotice.amount,
        category: deletedTxNotice.category,
        date: deletedTxNotice.date,
        description: deletedTxNotice.description,
        paymentMethod: deletedTxNotice.paymentMethod,
      });
      setDeletedTxNotice(null);
      triggerHaptic('success');
    }
  };

  // Quick helper to record tuition payment into manual transactions if user chooses
  const handleCopyTuitionAsTransaction = (studentName: string, amount: number) => {
    addTransaction({
      type: 'income',
      amount,
      category: 'Tuition Received',
      date: getLocalDateString(),
      description: `Tuition from ${studentName}`,
      paymentMethod: 'bKash',
    });
    triggerHaptic('success');
  };

  return (
    <main className="flex flex-col relative w-full px-4 pt-header-safe pb-32 bg-[#070b12] min-h-screen text-[#edf5ff]">
      <div className="flex flex-col w-full space-y-5">
        {/* Top Header Telemetry */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#35d9ff] shadow-[0_0_8px_#35d9ff]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[#35d9ff]">
              FINANCIAL LEDGER // BDT
            </span>
          </div>

          <span className="font-mono text-xs text-[#91a2b8]">
            {currentMonthStr}
          </span>
        </div>

        {/* 1. Main Net Balance Hero Card */}
        <div className="relative rounded-3xl bg-[#0c1320] p-5 border border-[#202c3d]/70 shadow-2xl overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#35d9ff]/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#91a2b8] uppercase tracking-wider font-semibold">
                Net Balance
              </span>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  balance >= 0
                    ? 'bg-[#5cffb7]/15 text-[#5cffb7] border border-[#5cffb7]/30'
                    : 'bg-[#ff5c78]/15 text-[#ff5c78] border border-[#ff5c78]/30'
                }`}
              >
                {balance >= 0 ? 'Surplus' : 'Deficit'}
              </span>
            </div>

            <div className="flex items-baseline space-x-1 font-mono">
              <span className="text-xl font-semibold text-[#35d9ff]">৳</span>
              <span
                className={`text-3xl font-extrabold tracking-tight ${
                  balance >= 0 ? 'text-[#edf5ff]' : 'text-[#ff5c78]'
                }`}
              >
                {Math.abs(balance).toLocaleString()}
              </span>
              {balance < 0 && (
                <span className="text-xs font-mono text-[#ff5c78] font-bold ml-1">
                  (Negative)
                </span>
              )}
            </div>

            {/* Income vs Expenses Bar */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#202c3d]/40">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#91a2b8] uppercase">Total Income</span>
                <span className="text-sm font-bold font-mono text-[#5cffb7] mt-0.5">
                  +৳{totalIncome.toLocaleString()}
                </span>
              </div>

              <div className="flex flex-col text-right">
                <span className="text-[10px] font-mono text-[#91a2b8] uppercase">Total Expenses</span>
                <span className="text-sm font-bold font-mono text-[#ff5c78] mt-0.5">
                  -৳{totalExpense.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Primary Action Bar: + Add Transaction Button */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenAdd('income')}
            className="py-3 px-4 rounded-2xl bg-gradient-to-r from-[#05f292]/20 to-[#35d9ff]/20 border border-[#5cffb7]/40 text-[#5cffb7] font-mono text-xs font-bold shadow-md hover:bg-[#5cffb7]/25 active:scale-95 transition-all flex items-center justify-center space-x-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Add Income</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenAdd('expense')}
            className="py-3 px-4 rounded-2xl bg-gradient-to-r from-[#ff5c78]/20 to-[#ff9800]/20 border border-[#ff5c78]/40 text-[#ff5c78] font-mono text-xs font-bold shadow-md hover:bg-[#ff5c78]/25 active:scale-95 transition-all flex items-center justify-center space-x-2"
          >
            <span className="material-symbols-outlined text-[18px]">remove_circle</span>
            <span>+ Add Expense</span>
          </button>
        </div>

        {/* 3. Filter Segment & Search */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#edf5ff]">Transaction History</h3>
            <span className="font-mono text-[10px] text-[#91a2b8]">
              {filteredTransactions.length} recorded
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-[#090f19] p-1 rounded-xl flex items-center font-mono text-xs border border-[#202c3d]/40">
              {(['all', 'income', 'expense'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setFilterType(tab);
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-center font-semibold capitalize transition-all ${
                    filterType === tab
                      ? 'bg-[#35d9ff] text-[#003641] shadow-sm font-bold'
                      : 'text-[#91a2b8] hover:text-[#edf5ff]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="w-1/3 bg-[#090f19] px-2.5 py-1.5 rounded-xl border border-[#202c3d]/40 flex items-center space-x-1">
              <span className="material-symbols-outlined text-[#91a2b8] text-[16px]">search</span>
              <input
                type="text"
                placeholder="Filter..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-[#edf5ff] placeholder-[#91a2b8]/50 focus:outline-none w-full font-mono"
              />
            </div>
          </div>
        </div>

        {/* 4. Transaction List */}
        <div className="flex flex-col space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#0c1320] border border-[#202c3d]/40 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#162338] text-[#35d9ff] mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </div>
              <h4 className="text-xs font-semibold text-[#edf5ff]">No Transactions Logged</h4>
              <p className="text-[11px] text-[#91a2b8] max-w-xs mx-auto">
                {filterType === 'all'
                  ? 'Your manual ledger is ready. Tap "+ Add Income" or "+ Add Expense" to record a financial transaction.'
                  : `No ${filterType} entries found matching your query.`}
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filteredTransactions.map(tx => {
                const isIncome = tx.type === 'income';
                return (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.18 }}
                    className="p-3.5 rounded-2xl bg-[#0c1320] border border-[#202c3d]/50 hover:border-[#35d9ff]/30 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-2">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-[#5cffb7]/15 text-[#5cffb7] border border-[#5cffb7]/30'
                            : 'bg-[#ff5c78]/15 text-[#ff5c78] border border-[#ff5c78]/30'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isIncome ? 'arrow_downward' : 'arrow_upward'}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-semibold text-[#edf5ff] truncate">
                            {tx.category}
                          </h4>
                          <span className="font-mono text-[9px] text-[#91a2b8] px-1.5 py-0.5 rounded bg-[#162338]">
                            {tx.paymentMethod || 'Cash'}
                          </span>
                        </div>

                        <p className="font-mono text-[10px] text-[#91a2b8] truncate mt-0.5">
                          {tx.date}
                          {tx.description ? ` • ${tx.description}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span
                        className={`font-mono text-sm font-bold ${
                          isIncome ? 'text-[#5cffb7]' : 'text-[#ff5c78]'
                        }`}
                      >
                        {isIncome ? '+' : '-'}৳{tx.amount.toLocaleString()}
                      </span>

                      {/* Edit & Delete Action Buttons */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(tx)}
                        className="p-1 rounded-lg hover:bg-[#162338] text-[#91a2b8] hover:text-[#35d9ff] transition-colors"
                        title="Edit transaction"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteTx(tx)}
                        className="p-1 rounded-lg hover:bg-[#162338] text-[#91a2b8] hover:text-[#ff5c78] transition-colors"
                        title="Delete transaction"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* 5. Tuition Reference Helper (Decoupled, manual reference only) */}
        {students.length > 0 && (
          <div className="pt-2">
            <details className="group bg-[#090f19] rounded-2xl border border-[#202c3d]/40 p-3.5 transition-all">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <div className="flex items-center space-x-2 font-mono text-xs text-[#91a2b8]">
                  <span className="material-symbols-outlined text-[#35d9ff] text-[16px]">
                    school
                  </span>
                  <span className="text-[#edf5ff] font-semibold">Tuition Students Due Summary</span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-[#91a2b8] group-open:rotate-180 transition-transform">
                  expand_more
                </span>
              </summary>

              <div className="pt-3 space-y-2">
                <p className="text-[11px] text-[#91a2b8] leading-relaxed">
                  Tuition tracking operates independently. If you receive fees and want them in your manual financial balance, tap "+ Record Income".
                </p>
                <div className="space-y-1.5">
                  {students.map(s => (
                    <div
                      key={s.id}
                      className="p-2 rounded-xl bg-[#0c1320] border border-[#202c3d]/30 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <span className="text-[#edf5ff] font-medium">{s.name}</span>
                        <span className="text-[#91a2b8] ml-2">Fee: ৳{s.monthlyFee.toLocaleString()}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyTuitionAsTransaction(s.name, s.monthlyFee)}
                        className="px-2 py-1 rounded bg-[#162338] text-[#5cffb7] hover:bg-[#1f314c] text-[10px] border border-[#5cffb7]/30 transition-all active:scale-95"
                      >
                        + Log ৳{s.monthlyFee.toLocaleString()} Income
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Undo Snackbar on Delete */}
      <AnimatePresence>
        {deletedTxNotice && (
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
                Deleted {deletedTxNotice.category} (৳{deletedTxNotice.amount.toLocaleString()})
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

      {/* Add / Edit Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-md bg-[#0c1320] border border-[#202c3d] rounded-3xl p-5 shadow-2xl flex flex-col space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#202c3d]/40">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      txType === 'income' ? 'bg-[#5cffb7]/20 text-[#5cffb7]' : 'bg-[#ff5c78]/20 text-[#ff5c78]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {txType === 'income' ? 'add_card' : 'payments'}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#edf5ff]">
                    {editingTx ? 'Edit Transaction' : 'Record Transaction'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-[#162338] text-[#91a2b8] hover:text-[#edf5ff] flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitTransaction} className="space-y-3.5">
                {/* Transaction Type Segment */}
                <div className="bg-[#090f19] p-1 rounded-xl flex items-center font-mono text-xs border border-[#202c3d]">
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setTxType('income');
                      if (EXPENSE_CATEGORIES.includes(txCategory)) setTxCategory('Tuition Received');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-center font-bold transition-all ${
                      txType === 'income'
                        ? 'bg-[#5cffb7] text-[#003822] shadow-sm'
                        : 'text-[#91a2b8] hover:text-[#edf5ff]'
                    }`}
                  >
                    Income (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setTxType('expense');
                      if (INCOME_CATEGORIES.includes(txCategory)) setTxCategory('Food & Dining');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-center font-bold transition-all ${
                      txType === 'expense'
                        ? 'bg-[#ff5c78] text-[#070b12] shadow-sm'
                        : 'text-[#91a2b8] hover:text-[#edf5ff]'
                    }`}
                  >
                    Expense (-)
                  </button>
                </div>

                {/* Amount */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-mono text-[#91a2b8]">AMOUNT (৳) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-mono text-sm text-[#91a2b8]">৳</span>
                    <input
                      type="number"
                      required
                      min={1}
                      autoFocus
                      placeholder="e.g. 5000"
                      value={txAmount}
                      onChange={e => setTxAmount(e.target.value)}
                      className="w-full bg-[#090f19] border border-[#202c3d] rounded-xl pl-8 pr-3 py-2 text-sm text-[#edf5ff] focus:outline-none focus:border-[#35d9ff] font-mono"
                    />
                  </div>
                </div>

                {/* Category with Chips */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-mono text-[#91a2b8]">CATEGORY</label>
                  <input
                    type="text"
                    required
                    value={txCategory}
                    onChange={e => setTxCategory(e.target.value)}
                    placeholder="Enter or select category..."
                    className="w-full bg-[#090f19] border border-[#202c3d] rounded-xl px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                  />

                  {/* Preset chips */}
                  <div className="flex items-center flex-wrap gap-1.5 pt-1">
                    {(txType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setTxCategory(cat);
                        }}
                        className={`px-2 py-0.5 rounded-lg font-mono text-[10px] transition-all ${
                          txCategory === cat
                            ? 'bg-[#35d9ff] text-[#003641] font-bold'
                            : 'bg-[#162338] text-[#91a2b8] hover:text-[#edf5ff]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date and Method */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] text-[#91a2b8]">DATE</label>
                    <input
                      type="date"
                      value={txDate}
                      onChange={e => setTxDate(e.target.value)}
                      className="bg-[#090f19] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] text-[#91a2b8]">METHOD</label>
                    <select
                      value={txPaymentMethod}
                      onChange={e => setTxPaymentMethod(e.target.value)}
                      className="bg-[#090f19] border border-[#202c3d] rounded-lg px-2 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    >
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Rocket">Rocket</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                </div>

                {/* Description or Notes */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-mono text-[#91a2b8]">NOTES / DESCRIPTION (OPTIONAL)</label>
                  <input
                    type="text"
                    placeholder="e.g. October tuition or grocery receipt"
                    value={txDescription}
                    onChange={e => setTxDescription(e.target.value)}
                    className="w-full bg-[#090f19] border border-[#202c3d] rounded-xl px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-mono text-[#91a2b8] hover:text-[#edf5ff]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#35d9ff] text-[#003641] font-mono text-xs font-bold shadow-md hover:bg-[#b5edff] active:scale-95 transition-all"
                  >
                    {editingTx ? 'Update Transaction' : 'Save Transaction'}
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
