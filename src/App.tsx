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
import { AnimatePresence, motion } from 'motion/react';

const MainAppContent: React.FC = () => {
  const { activeTab, preferences } = useApp();

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
