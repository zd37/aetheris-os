import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CyberLogo } from '../common/CyberLogo';
import { AppSection } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

const ONBOARDING_STORAGE_KEY = 'aetheris_onboarding_draft_v2';

interface ModuleOption {
  id: AppSection;
  title: string;
  description: string;
  icon: string;
}

const AVAILABLE_MODULES: ModuleOption[] = [
  {
    id: 'home',
    title: 'Command Home',
    description: 'Dynamic daily greeting, Salah tracker & routine timeline',
    icon: 'home',
  },
  {
    id: 'tuition',
    title: 'Academic & Tuition',
    description: 'Student profiles, main calendar, attendance & schedules',
    icon: 'school',
  },
  {
    id: 'gym',
    title: 'Gym & Fitness',
    description: 'Weekly workouts, exercise routines & session consistency',
    icon: 'fitness_center',
  },
  {
    id: 'todo',
    title: 'To-Do & Tasks',
    description: 'Daily/weekly tasks, quick notes & shopping wishlist',
    icon: 'checklist',
  },
  {
    id: 'money',
    title: 'Money Management',
    description: 'Tuition fees ledger, student dues in ৳ & income graphs',
    icon: 'account_balance_wallet',
  },
  {
    id: 'projects',
    title: 'Projects & Code',
    description: 'Milestone tracking, roadmap vectors & documentation links',
    icon: 'layers',
  },
];

export const OnboardingFlow: React.FC = () => {
  const { completeOnboarding, addStudent } = useApp();

  // Load saved draft if user previously left mid-setup
  const [currentStep, setCurrentStep] = useState<number>(() => {
    try {
      const draft = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        return typeof parsed.step === 'number' ? parsed.step : 0;
      }
    } catch (e) {}
    return 0;
  });

  const [userName, setUserName] = useState<string>(() => {
    try {
      const draft = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (draft) return JSON.parse(draft).userName || '';
    } catch (e) {}
    return '';
  });

  const [selectedModules, setSelectedModules] = useState<AppSection[]>(() => {
    try {
      const draft = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (draft && Array.isArray(JSON.parse(draft).selectedModules)) {
        return JSON.parse(draft).selectedModules;
      }
    } catch (e) {}
    return ['home', 'tuition', 'gym', 'todo', 'money'];
  });

  const [gymDaysGoal, setGymDaysGoal] = useState<number>(() => {
    try {
      const draft = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (draft && typeof JSON.parse(draft).gymDaysGoal === 'number') {
        return JSON.parse(draft).gymDaysGoal;
      }
    } catch (e) {}
    return 4;
  });

  // Optional first student setup
  const [showInlineStudentForm, setShowInlineStudentForm] = useState(false);
  const [stName, setStName] = useState('');
  const [stPhone, setStPhone] = useState('');
  const [stGrade, setStGrade] = useState('');
  const [stFee, setStFee] = useState<number>(5000);
  const [stSubjects, setStSubjects] = useState('Physics, Math');
  const [stDays, setStDays] = useState('Mon, Wed, Fri');

  const [isLaunching, setIsLaunching] = useState(false);

  // Save progress draft whenever fields change
  useEffect(() => {
    try {
      localStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({
          step: currentStep,
          userName,
          selectedModules,
          gymDaysGoal,
        })
      );
    } catch (e) {}
  }, [currentStep, userName, selectedModules, gymDaysGoal]);

  const toggleModule = (id: AppSection) => {
    if (id === 'home') return; // Home remains always accessible
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleLaunch = () => {
    setIsLaunching(true);

    // If user filled in the optional first student
    if (showInlineStudentForm && stName.trim()) {
      addStudent({
        name: stName.trim(),
        phone: stPhone.trim() || undefined,
        gradeOrClass: stGrade.trim() || 'Class 9',
        monthlyFee: Number(stFee) || 5000,
        monthlyTarget: 16,
        subjects: stSubjects.split(',').map(s => s.trim()).filter(Boolean),
        preferredDays: stDays.split(',').map(d => d.trim()).filter(Boolean),
      });
    }

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#35d9ff', '#5cffb7', '#cdbdff'],
      });
    } catch (e) {}

    setTimeout(() => {
      // Clear draft
      try {
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      } catch (e) {}

      completeOnboarding({
        name: userName.trim() || 'Explorer',
        weeklyGymTarget: gymDaysGoal,
        enabledSections: selectedModules.length > 0 ? selectedModules : ['home', 'tuition', 'gym', 'todo', 'money', 'projects'],
      });
    }, 1200);
  };

  const stepLabels = ['1. INTRO', '2. VISION', '3. MODULES', '4. READY'];

  return (
    <div className="fixed inset-0 z-50 bg-[#070b12] text-[#edf5ff] flex flex-col justify-between overflow-y-auto selection:bg-[#35d9ff] selection:text-[#003641]">
      {/* Dynamic ambient cyber blur background */}
      <div className="pointer-events-none fixed -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#35d9ff]/10 rounded-full blur-3xl z-0" />
      <div className="pointer-events-none fixed top-1/2 -left-20 w-80 h-80 bg-[#502cb0]/15 rounded-full blur-3xl z-0" />
      <div className="pointer-events-none fixed -bottom-16 right-0 w-88 h-88 bg-[#5cffb7]/10 rounded-full blur-3xl z-0" />

      {/* Header HUD: Progress Bar & Stepper */}
      <header className="relative z-20 px-4 pt-safe pt-3 max-w-md w-full mx-auto flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#162338]/80 backdrop-blur-md border border-[#202c3d]/40">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#5cffb7] animate-pulse" />
            <span className="font-mono text-[10px] text-[#5cffb7] tracking-widest uppercase font-semibold">
              INITIALIZING PROTOCOL
            </span>
          </div>

          <button
            onClick={() => setCurrentStep(3)}
            type="button"
            className="font-mono text-xs text-[#91a2b8] hover:text-[#35d9ff] transition-colors flex items-center space-x-0.5"
          >
            <span>SKIP SETUP</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          </button>
        </div>

        {/* Stepper Navigation */}
        <nav
          aria-label="Onboarding Progress"
          className="relative p-1 rounded-full bg-[#090f19]/90 backdrop-blur-lg flex items-center justify-between border border-[#202c3d]/40 shadow-lg"
        >
          {stepLabels.map((lbl, idx) => {
            const isActive = currentStep === idx;
            return (
              <button
                key={lbl}
                onClick={() => setCurrentStep(idx)}
                type="button"
                className={`flex-1 py-1 px-1 rounded-full font-mono text-[10px] text-center transition-all duration-300 font-semibold ${
                  isActive
                    ? 'bg-[#35d9ff] text-[#003641] shadow-md font-bold'
                    : 'text-[#91a2b8] hover:text-[#edf5ff]'
                }`}
              >
                {lbl}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Step Flow */}
      <main className="relative z-10 flex-1 max-w-md w-full mx-auto px-4 py-4 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {/* ================= STAGE 0: INTRO ================= */}
          {currentStep === 0 && (
            <motion.section
              key="step-0"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-between space-y-6"
            >
              <div className="w-full flex flex-col items-center pt-2 text-center">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#35d9ff]/10 mb-6 backdrop-blur-sm border border-[#35d9ff]/20">
                  <span className="w-2 h-2 rounded-full bg-[#35d9ff] shadow-[0_0_8px_#35d9ff] animate-ping" />
                  <span className="font-mono text-[10px] text-[#35d9ff] tracking-widest uppercase font-semibold">
                    Personal Life OS
                  </span>
                </div>

                {/* Animated Kinetic Logo */}
                <CyberLogo size="xl" />

                <div className="mt-5 space-y-1.5 max-w-xs">
                  <h1 className="text-2xl font-bold tracking-tight text-[#edf5ff]">
                    AETHERIS <span className="text-[#35d9ff]">OS</span>
                  </h1>
                  <p className="text-xs text-[#91a2b8] leading-relaxed">
                    Adaptive personal telemetry, tuition management in ৳, student attendance, daily Salah, and focused habit protocols.
                  </p>
                </div>

                {/* Micro Telemetry Chips */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-[#0c1320] border border-[#202c3d]/60 font-mono text-[10px] text-[#35d9ff] flex items-center space-x-1">
                    <span className="material-symbols-outlined text-[13px]">bolt</span>
                    <span>Zero Latency</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#0c1320] border border-[#202c3d]/60 font-mono text-[10px] text-[#5cffb7] flex items-center space-x-1">
                    <span className="material-symbols-outlined text-[13px]">lock</span>
                    <span>Local-First</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[#0c1320] border border-[#202c3d]/60 font-mono text-[10px] text-[#cdbdff] flex items-center space-x-1">
                    <span className="material-symbols-outlined text-[13px]">verified_user</span>
                    <span>Zero Trackers</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#35d9ff] text-[#003641] font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  <span>Explore Aetheris</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full py-2 font-mono text-xs text-[#91a2b8] hover:text-[#edf5ff] transition-colors flex items-center justify-center space-x-1"
                >
                  <span>Quick Module Setup</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                </button>
              </div>
            </motion.section>
          )}

          {/* ================= STAGE 1: VISION & PHILOSOPHY ================= */}
          {currentStep === 1 && (
            <motion.section
              key="step-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-[#162338] border border-[#202c3d] font-mono text-[10px] text-[#35d9ff] mb-2 uppercase">
                  Design Architecture
                </div>
                <h2 className="text-xl font-bold text-[#edf5ff] leading-tight">
                  Make space for what matters.
                </h2>
                <p className="text-xs text-[#91a2b8] mt-1">
                  Organize your teaching routines, master tuition finances in ৳, and maintain mental clarity without noise.
                </p>

                {/* 3 Pillars */}
                <div className="flex flex-col space-y-2.5 mt-4">
                  <div className="p-3 rounded-xl bg-[#0c1320] border border-[#202c3d]/50 flex items-start space-x-3 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-[#35d9ff]/15 flex items-center justify-center shrink-0 text-[#35d9ff]">
                      <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#edf5ff]">Intelligent Balance</h4>
                      <p className="text-[11px] text-[#91a2b8] mt-0.5 leading-snug">
                        Proactive telemetry for tuition schedules, gym splits, and daily Salah routines.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0c1320] border border-[#202c3d]/50 flex items-start space-x-3 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-[#cdbdff]/15 flex items-center justify-center shrink-0 text-[#cdbdff]">
                      <span className="material-symbols-outlined text-[20px]">filter_center_focus</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#edf5ff]">Zero Clutter</h4>
                      <p className="text-[11px] text-[#91a2b8] mt-0.5 leading-snug">
                        Starts clean and empty until you enter your real data. No mock numbers or fake profiles.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0c1320] border border-[#202c3d]/50 flex items-start space-x-3 shadow-sm">
                    <div className="w-9 h-9 rounded-lg bg-[#5cffb7]/15 flex items-center justify-center shrink-0 text-[#5cffb7]">
                      <span className="material-symbols-outlined text-[20px]">shield</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#edf5ff]">Local-First Storage</h4>
                      <p className="text-[11px] text-[#91a2b8] mt-0.5 leading-snug">
                        Every student record, fee payment, and task stays stored on your device.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#35d9ff] text-[#003641] font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  <span>Select Active Modules</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="w-full py-2 font-mono text-xs text-[#91a2b8] hover:text-[#edf5ff] transition-colors flex items-center justify-center space-x-1"
                >
                  <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                  <span>Previous Step</span>
                </button>
              </div>
            </motion.section>
          )}

          {/* ================= STAGE 2: SELECT MODULES ================= */}
          {currentStep === 2 && (
            <motion.section
              key="step-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xl font-bold text-[#edf5ff]">Select Modules</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#35d9ff]/20 font-mono text-[10px] text-[#35d9ff] font-bold">
                    {selectedModules.length} of {AVAILABLE_MODULES.length} Active
                  </span>
                </div>
                <p className="text-xs text-[#91a2b8] mb-3">
                  Choose the sections you want to enable. You can change these anytime in Settings.
                </p>

                {/* Module Cards Grid */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-0.5">
                  {AVAILABLE_MODULES.map(mod => {
                    const isSelected = selectedModules.includes(mod.id);
                    const isHome = mod.id === 'home';

                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                          isSelected
                            ? 'bg-[#0c1320] border-[#35d9ff]/50 shadow-[0_0_12px_rgba(53,217,255,0.12)]'
                            : 'bg-[#090f19] border-[#202c3d]/40 opacity-60 hover:opacity-80'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0 pr-2">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#35d9ff]/20 text-[#35d9ff]'
                                : 'bg-[#162338] text-[#91a2b8]'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">{mod.icon}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <h4 className="text-xs font-semibold text-[#edf5ff] truncate">{mod.title}</h4>
                              {isHome && (
                                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#162338] text-[#35d9ff]">
                                  Core
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#91a2b8] truncate mt-0.5">{mod.description}</p>
                          </div>
                        </div>

                        {/* Checkbox indicator */}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-[#35d9ff] text-[#003641]'
                              : 'border border-[#202c3d] text-transparent'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#35d9ff] text-[#003641] font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  <span>Continue with {selectedModules.length} Modules</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-full py-2 font-mono text-xs text-[#91a2b8] hover:text-[#edf5ff] transition-colors flex items-center justify-center space-x-1"
                >
                  <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                  <span>Previous Step</span>
                </button>
              </div>
            </motion.section>
          )}

          {/* ================= STAGE 3: ESSENTIAL INFO & READY ================= */}
          {currentStep === 3 && (
            <motion.section
              key="step-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#5cffb7] animate-pulse" />
                  <span className="font-mono text-[10px] text-[#5cffb7] uppercase tracking-widest font-semibold">
                    Final Calibration
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#edf5ff]">Personalize Your Setup</h2>
                <p className="text-xs text-[#91a2b8] mb-3">
                  Only needed settings are asked. No unnecessary personal data is collected.
                </p>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {/* Name field */}
                  <div className="p-3.5 rounded-xl bg-[#0c1320] border border-[#202c3d]/50 space-y-1.5">
                    <label className="font-mono text-[10px] text-[#35d9ff] uppercase font-semibold">
                      Your Name / Calling Name
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={e => setUserName(e.target.value)}
                      placeholder="e.g. Sifat"
                      className="w-full bg-[#070b12] border border-[#202c3d] rounded-lg px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                    />
                    <span className="text-[10px] text-[#91a2b8] block">
                      Used for your greeting and dashboard headers.
                    </span>
                  </div>

                  {/* Gym goal (if gym enabled) */}
                  {selectedModules.includes('gym') && (
                    <div className="p-3.5 rounded-xl bg-[#0c1320] border border-[#202c3d]/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="font-mono text-[10px] text-[#5cffb7] uppercase font-semibold">
                          Weekly Gym Commitment
                        </label>
                        <span className="font-mono text-xs text-[#5cffb7] font-bold">
                          {gymDaysGoal} Days / Week
                        </span>
                      </div>
                      <div className="flex space-x-1.5">
                        {[2, 3, 4, 5, 6].map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setGymDaysGoal(d)}
                            className={`flex-1 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all ${
                              gymDaysGoal === d
                                ? 'bg-[#5cffb7] text-[#003823] shadow-md'
                                : 'bg-[#162338] text-[#91a2b8] hover:text-[#edf5ff]'
                            }`}
                          >
                            {d}d
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Optional Tuition quick starter (if tuition enabled) */}
                  {selectedModules.includes('tuition') && (
                    <div className="p-3.5 rounded-xl bg-[#0c1320] border border-[#202c3d]/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-mono text-[10px] text-[#cdbdff] uppercase font-semibold block">
                            Tuition Students
                          </label>
                          <span className="text-[10px] text-[#91a2b8]">
                            Start with a clean app or add your first student now.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowInlineStudentForm(!showInlineStudentForm)}
                          className="font-mono text-[10px] px-2 py-1 rounded-lg bg-[#162338] text-[#cdbdff] hover:bg-[#1f314c]"
                        >
                          {showInlineStudentForm ? 'Skip for now' : '+ Add Student'}
                        </button>
                      </div>

                      {showInlineStudentForm && (
                        <div className="pt-2 border-t border-[#202c3d]/40 space-y-2">
                          <input
                            type="text"
                            placeholder="Student Full Name *"
                            value={stName}
                            onChange={e => setStName(e.target.value)}
                            className="w-full bg-[#070b12] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="tel"
                              placeholder="Phone Number *"
                              value={stPhone}
                              onChange={e => setStPhone(e.target.value)}
                              className="bg-[#070b12] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                            />
                            <input
                              type="text"
                              placeholder="Class/Grade *"
                              value={stGrade}
                              onChange={e => setStGrade(e.target.value)}
                              className="bg-[#070b12] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              placeholder="Monthly Fee (৳) *"
                              value={stFee}
                              onChange={e => setStFee(Number(e.target.value))}
                              className="bg-[#070b12] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                            />
                            <input
                              type="text"
                              placeholder="Days (e.g. Mon, Wed) *"
                              value={stDays}
                              onChange={e => setStDays(e.target.value)}
                              className="bg-[#070b12] border border-[#202c3d] rounded-lg px-2.5 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary of active modules */}
                  <div className="p-3 rounded-xl bg-[#090f19] border border-[#202c3d]/30">
                    <span className="font-mono text-[10px] text-[#91a2b8] uppercase tracking-wider block mb-1.5">
                      Activated Modules
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedModules.map(m => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded-full bg-[#162338] text-[#35d9ff] font-mono text-[10px] capitalize"
                        >
                          {m === 'money' ? 'Money (৳)' : m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Launch Button */}
              <div className="w-full flex flex-col space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isLaunching}
                  onClick={handleLaunch}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#35d9ff] to-[#5cffb7] text-[#003641] font-bold text-sm flex items-center justify-center space-x-2 shadow-xl hover:brightness-110 active:scale-95 transition-all"
                >
                  <span>{isLaunching ? 'Calibrating Systems...' : 'Enter Aetheris OS'}</span>
                  <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                </button>
                <button
                  type="button"
                  disabled={isLaunching}
                  onClick={() => setCurrentStep(2)}
                  className="w-full py-2 font-mono text-xs text-[#91a2b8] hover:text-[#edf5ff] transition-colors flex items-center justify-center space-x-1"
                >
                  <span className="material-symbols-outlined text-[14px]">tune</span>
                  <span>Reconfigure Modules</span>
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Launch Celebration Curtain */}
      {isLaunching && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070b12]/95 backdrop-blur-2xl transition-all duration-700 animate-fadeIn">
          <CyberLogo size="lg" />
          <h2 className="text-xl font-bold tracking-wider text-[#edf5ff] mt-4">
            AETHERIS OS
          </h2>
          <span className="font-mono text-xs text-[#35d9ff] mt-2 flex items-center space-x-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-[#35d9ff] animate-ping" />
            <span>CALIBRATION COMPLETE • ENTERING DASHBOARD...</span>
          </span>
        </div>
      )}
    </div>
  );
};
