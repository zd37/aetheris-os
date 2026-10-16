import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppSection } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export const ProfileSettingsModal: React.FC = () => {
  const {
    isProfileModalOpen,
    setIsProfileModalOpen,
    preferences,
    updatePreferences,
    resetOnboarding,
    exportBackup,
    importBackup,
    resetAllData,
  } = useApp();

  const [nameInput, setNameInput] = useState(preferences.name);
  const [gymTarget, setGymTarget] = useState(preferences.weeklyGymTarget || 4);
  const [saveNotice, setSaveNotice] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Active sections state
  const [enabledSections, setEnabledSections] = useState<AppSection[]>(
    preferences.enabledSections || ['home', 'tuition', 'gym', 'todo', 'money', 'projects']
  );

  if (!isProfileModalOpen) return null;

  const toggleSection = (sec: AppSection) => {
    if (sec === 'home') return; // Home remains always active
    setEnabledSections(prev =>
      prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]
    );
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      name: nameInput.trim() || 'Explorer',
      weeklyGymTarget: Number(gymTarget) || 4,
      enabledSections: enabledSections.length > 0 ? enabledSections : ['home', 'tuition', 'gym', 'todo', 'money'],
    });
    setSaveNotice('Settings updated successfully.');
    setTimeout(() => setSaveNotice(''), 2500);
  };

  const handleExport = () => {
    const backup = exportBackup();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `aetheris_os_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = importBackup(json);
        if (success) {
          alert('Backup restored successfully!');
          setIsProfileModalOpen(false);
        } else {
          alert('Invalid backup structure.');
        }
      } catch (err) {
        alert('Failed to parse JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = () => {
    resetAllData();
    resetOnboarding();
    setShowResetConfirm(false);
    setIsProfileModalOpen(false);
  };

  const SECTION_OPTIONS: { id: AppSection; label: string; icon: string }[] = [
    { id: 'home', label: 'Command Home', icon: 'home' },
    { id: 'tuition', label: 'Academic & Tuition', icon: 'school' },
    { id: 'gym', label: 'Gym & Fitness', icon: 'fitness_center' },
    { id: 'todo', label: 'To-Do & Tasks', icon: 'checklist' },
    { id: 'money', label: 'Money Management (৳)', icon: 'account_balance_wallet' },
    { id: 'projects', label: 'Projects & Code', icon: 'layers' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setIsProfileModalOpen(false)}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative z-10 w-full max-w-lg bg-[#0c1320] border-t sm:border border-[#202c3d]/60 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[88vh] flex flex-col space-y-4 overflow-y-auto"
      >
        <div className="w-12 h-1.5 bg-[#202c3d] rounded-full mx-auto" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#202c3d]/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-[#162338] border border-[#202c3d] flex items-center justify-center text-[#edf5ff]">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#edf5ff]">Profile &amp; Settings</h3>
              <p className="font-mono text-xs text-[#91a2b8]">Aetheris OS • Cyber Telemetry</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsProfileModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#162338] flex items-center justify-center text-[#91a2b8] hover:text-[#edf5ff]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Profile Settings Form */}
        <form onSubmit={handleSaveProfile} className="space-y-3.5 bg-[#090f19] p-4 rounded-2xl border border-[#202c3d]/40">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#35d9ff] uppercase font-semibold">
              User Identity
            </span>
            {saveNotice && (
              <span className="text-xs text-[#5cffb7] font-mono">{saveNotice}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-mono text-[#91a2b8]">DISPLAY NAME</label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-mono text-[#91a2b8]">WEEKLY GYM GOAL</label>
              <input
                type="number"
                min={1}
                max={7}
                value={gymTarget}
                onChange={e => setGymTarget(Number(e.target.value))}
                className="bg-[#0c1320] border border-[#202c3d] rounded-lg px-3 py-1.5 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
              />
            </div>
          </div>

          {/* Active Sections Manager */}
          <div className="space-y-2 pt-1 border-t border-[#202c3d]/30">
            <span className="font-mono text-[10px] text-[#35d9ff] uppercase font-semibold block">
              Active App Sections
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {SECTION_OPTIONS.map(sec => {
                const isActive = enabledSections.includes(sec.id);
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => toggleSection(sec.id)}
                    className={`p-2 rounded-lg border text-left flex items-center justify-between text-xs transition-all ${
                      isActive
                        ? 'bg-[#162338] border-[#35d9ff]/50 text-[#edf5ff]'
                        : 'bg-[#0c1320] border-[#202c3d]/30 text-[#91a2b8]'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="material-symbols-outlined text-[16px] text-[#35d9ff]">
                        {sec.icon}
                      </span>
                      <span className="truncate">{sec.label}</span>
                    </div>
                    {isActive && (
                      <span className="material-symbols-outlined text-[14px] text-[#35d9ff]">
                        check
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#162338] hover:bg-[#1f314c] text-[#35d9ff] font-mono text-xs font-semibold transition-colors"
          >
            Save Changes
          </button>
        </form>

        {/* Data Reliability & Local Backup Tools */}
        <div className="bg-[#090f19] p-4 rounded-2xl border border-[#202c3d]/40 space-y-3">
          <span className="font-mono text-xs text-[#35d9ff] uppercase font-semibold block">
            Data Reliability &amp; Local Backup
          </span>
          <p className="text-xs text-[#91a2b8]">
            All student profiles, tuition calendars, payments, workout logs, tasks, and projects are stored persistently in your device's local database.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="py-2.5 rounded-xl bg-[#0c1320] border border-[#202c3d] hover:border-[#35d9ff]/50 text-[#edf5ff] font-mono text-xs flex items-center justify-center space-x-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[16px] text-[#35d9ff]">download</span>
              <span>Export JSON</span>
            </button>

            <label className="py-2.5 rounded-xl bg-[#0c1320] border border-[#202c3d] hover:border-[#35d9ff]/50 text-[#edf5ff] font-mono text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer">
              <span className="material-symbols-outlined text-[16px] text-[#5cffb7]">upload</span>
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Destructive Actions & App Reset */}
        <div className="bg-[#090f19] p-4 rounded-2xl border border-[#ff5c78]/20 space-y-2">
          <span className="font-mono text-xs text-[#ff5c78] uppercase font-semibold block">
            Danger Zone
          </span>
          <p className="text-xs text-[#91a2b8]">
            Reset the app to start over with a clean slate and re-launch the onboarding setup.
          </p>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-2.5 rounded-xl bg-[#ff5c78]/10 text-[#ff5c78] border border-[#ff5c78]/30 font-mono text-xs font-semibold hover:bg-[#ff5c78]/20 transition-all flex items-center justify-center space-x-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            <span>Reset All App Data</span>
          </button>
        </div>

        {/* Reset Confirmation Modal */}
        <AnimatePresence>
          {showResetConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setShowResetConfirm(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-10 w-full max-w-sm bg-[#0c1320] border border-[#ff5c78]/50 rounded-2xl p-5 shadow-2xl space-y-4 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-[#ff5c78]/15 text-[#ff5c78] mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">warning</span>
                </div>
                <h4 className="text-base font-bold text-[#edf5ff]">Reset App Data?</h4>
                <p className="text-xs text-[#91a2b8] leading-relaxed">
                  This will delete all saved student profiles, attendance marks, payment receipts, tasks, and notes, returning the app to the initial setup screen. This cannot be undone.
                </p>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#162338] text-[#91a2b8] font-mono text-xs hover:text-[#edf5ff]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmReset}
                    className="flex-1 py-2.5 rounded-xl bg-[#ff5c78] text-[#070b12] font-mono text-xs font-bold shadow-md hover:brightness-110"
                  >
                    Yes, Reset
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
