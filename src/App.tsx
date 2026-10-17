import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { IOSStatusBar } from './components/layout/IOSStatusBar';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { HomeScreen } from './components/home/HomeScreen';
import { TuitionScreen } from './components/tuition/TuitionScreen';
import { GymScreen } from './components/gym/GymScreen';
import { TodoScreen } from './components/todo/TodoScreen';
import { ProjectsScreen } from './components/projects/ProjectsScreen';
import { MoneyManagementScreen } from './components/money/MoneyManagementScreen';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { GeminiModal } from './components/gemini/GeminiModal';
import { ProfileSettingsModal } from './components/profile/ProfileSettingsModal';
import { CyberLogo } from './components/common/CyberLogo';
import { AnimatePresence, motion } from 'motion/react';

const MainAppContent: React.FC = () => {
  const { activeTab, preferences, isStorageReady } = useApp();

  // Guard: Never display Onboarding screen until persistent storage has hydrated
  if (!isStorageReady) {
    return (
      <div className="fixed inset-0 bg-[#070b12] flex flex-col items-center justify-center text-[#edf5ff] z-50">
        <div className="w-16 h-16 rounded-2xl bg-[#0c1320] border border-[#35d9ff]/30 flex items-center justify-center text-[#35d9ff] shadow-[0_0_24px_rgba(53,217,255,0.2)] mb-4">
          <CyberLogo size="md" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#35d9ff] animate-ping" />
          <span className="font-mono text-xs tracking-widest uppercase text-[#91a2b8]">
            Restoring System State...
          </span>
        </div>
      </div>
    );
  }

  if (!preferences.onboardingCompleted) {
    return <OnboardingFlow />;
  }

  const getTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'Home';
      case 'tuition':
        return 'Tuition';
      case 'gym':
        return 'Gym';
      case 'todo':
        return 'To-do';
      case 'projects':
        return 'Projects';
      case 'money':
        return 'Money Management';
      default:
        return 'Aetheris OS';
    }
  };

  return (
    <div className="relative min-h-screen bg-[#070b12] text-[#edf5ff] overflow-x-hidden selection:bg-[#35d9ff] selection:text-[#003641]">
      {/* Top iOS Navigation Bar */}
      <IOSStatusBar title={getTitle()} />

      {/* Screen Views with Animated Transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full"
        >
          {activeTab === 'home' && <HomeScreen />}
          {activeTab === 'tuition' && <TuitionScreen />}
          {activeTab === 'gym' && <GymScreen />}
          {activeTab === 'todo' && <TodoScreen />}
          {activeTab === 'projects' && <ProjectsScreen />}
          {activeTab === 'money' && <MoneyManagementScreen />}
        </motion.div>
      </AnimatePresence>

      {/* Bottom iOS Navigation Bar */}
      <BottomNavigation />

      {/* Global Modals */}
      <GeminiModal />
      <ProfileSettingsModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
