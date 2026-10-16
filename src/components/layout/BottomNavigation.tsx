import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';

export const BottomNavigation: React.FC = () => {
  const { activeTab, setActiveTab, preferences } = useApp();
  const [isOthersPanelOpen, setIsOthersPanelOpen] = useState(false);

  // The 5 fixed bottom navigation items requested
  const isOthersActive = activeTab === 'projects' || activeTab === 'money';

  const handleNavClick = (key: 'home' | 'tuition' | 'gym' | 'todo' | 'others') => {
    if (key === 'others') {
      setIsOthersPanelOpen(prev => !prev);
    } else {
      setIsOthersPanelOpen(false);
      setActiveTab(key);
    }
  };

  const handleSelectOtherSection = (section: 'projects' | 'money') => {
    setActiveTab(section);
    setIsOthersPanelOpen(false);
  };

  const navItems = [
    { key: 'home', label: 'Home', icon: 'home', isActive: activeTab === 'home' },
    { key: 'tuition', label: 'Tuition', icon: 'school', isActive: activeTab === 'tuition' },
    { key: 'gym', label: 'Gym', icon: 'fitness_center', isActive: activeTab === 'gym' },
    { key: 'todo', label: 'To-do', icon: 'checklist', isActive: activeTab === 'todo' },
    {
      key: 'others',
      label: 'Others',
      icon: 'apps',
      isActive: isOthersActive,
      subLabel: activeTab === 'projects' ? 'Projects' : activeTab === 'money' ? 'Money' : undefined,
    },
  ] as const;

  return (
    <>
      {/* Others Menu Popup Panel */}
      <AnimatePresence>
        {isOthersPanelOpen && (
          <div className="fixed inset-0 z-40 flex items-end justify-center pointer-events-auto">
            {/* Backdrop click to dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOthersPanelOpen(false)}
            />

            {/* Floating Menu Drawer */}
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-50 w-full max-w-sm mx-4 mb-24 bg-[#0c1320]/95 backdrop-blur-2xl border border-[#202c3d] rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.7)] space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#202c3d]/40">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#35d9ff] animate-pulse" />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#35d9ff] font-semibold">
                    ADDITIONAL MODULES
                  </span>
                </div>
                <button
                  onClick={() => setIsOthersPanelOpen(false)}
                  className="w-6 h-6 rounded-full bg-[#162338] flex items-center justify-center text-[#91a2b8] hover:text-[#edf5ff]"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>

              {/* Options */}
              <div className="flex flex-col space-y-2">
                {/* Option 1: Projects */}
                <button
                  type="button"
                  onClick={() => handleSelectOtherSection('projects')}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.98] ${
                    activeTab === 'projects'
                      ? 'bg-[#162338] border-[#35d9ff]/50 shadow-[0_0_12px_rgba(53,217,255,0.2)]'
                      : 'bg-[#090f19] border-[#202c3d]/40 hover:bg-[#162338]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        activeTab === 'projects'
                          ? 'bg-[#35d9ff]/20 text-[#35d9ff]'
                          : 'bg-[#162338] text-[#91a2b8]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">layers</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#edf5ff]">Projects</h4>
                      <p className="text-[10px] text-[#91a2b8] mt-0.5">
                        Roadmaps, milestones &amp; technical vectors
                      </p>
                    </div>
                  </div>

                  {activeTab === 'projects' && (
                    <span className="font-mono text-[10px] text-[#35d9ff] px-2 py-0.5 rounded-full bg-[#35d9ff]/15">
                      Active
                    </span>
                  )}
                </button>

                {/* Option 2: Money Management */}
                <button
                  type="button"
                  onClick={() => handleSelectOtherSection('money')}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between text-left transition-all active:scale-[0.98] ${
                    activeTab === 'money'
                      ? 'bg-[#162338] border-[#35d9ff]/50 shadow-[0_0_12px_rgba(53,217,255,0.2)]'
                      : 'bg-[#090f19] border-[#202c3d]/40 hover:bg-[#162338]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        activeTab === 'money'
                          ? 'bg-[#35d9ff]/20 text-[#35d9ff]'
                          : 'bg-[#162338] text-[#91a2b8]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        account_balance_wallet
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#edf5ff]">Money Management</h4>
                      <p className="text-[10px] text-[#91a2b8] mt-0.5">
                        Tuition income, student dues &amp; ৳ ledger
                      </p>
                    </div>
                  </div>

                  {activeTab === 'money' && (
                    <span className="font-mono text-[10px] text-[#35d9ff] px-2 py-0.5 rounded-full bg-[#35d9ff]/15">
                      Active
                    </span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Fixed 5-Button Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-[#070b12]/90 backdrop-blur-2xl shadow-[0_-1px_16px_rgba(0,0,0,0.6)] border-t border-[#202c3d]/40">
        <div className="flex justify-between items-center h-16 px-2 max-w-lg mx-auto">
          {navItems.map(item => {
            const isActive = item.isActive;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.key as any)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 flex flex-col items-center justify-center h-12 transition-all active:scale-95 relative ${
                  isActive
                    ? 'text-[#35d9ff] drop-shadow-[0_0_10px_rgba(53,217,255,0.45)] font-semibold'
                    : 'text-[#91a2b8] hover:text-[#edf5ff]'
                }`}
              >
                {/* Active Indicator Beacon */}
                {isActive && (
                  <span className="absolute -top-1 w-1 h-1 rounded-full bg-[#35d9ff] shadow-[0_0_6px_#35d9ff]" />
                )}

                <span className="material-symbols-outlined text-[22px]">
                  {item.icon}
                </span>

                <span className="text-[10px] leading-tight mt-1 font-sans">
                  {item.key === 'others' && item.subLabel ? item.subLabel : item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* iOS Home Indicator Bar */}
        <div className="flex justify-center pb-2">
          <div className="w-32 h-1 bg-[#91a2b8]/20 rounded-full" />
        </div>
      </nav>
    </>
  );
};
