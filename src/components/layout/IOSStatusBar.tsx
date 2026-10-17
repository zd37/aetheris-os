import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

interface IOSStatusBarProps {
  title: string;
}

export const IOSStatusBar: React.FC<IOSStatusBarProps> = ({ title }) => {
  const {
    activeTab,
    setIsProfileModalOpen,
    setIsGeminiModalOpen,
    setIsNotesModalOpen,
    setIsBuyModalOpen,
    setGeminiInitialPrompt,
    notes,
    shoppingList,
  } = useApp();

  const openGeminiWithContext = () => {
    if (activeTab === 'tuition') {
      setGeminiInitialPrompt('How is my tuition teaching schedule and which student payments are pending?');
    } else if (activeTab === 'gym') {
      setGeminiInitialPrompt('How is my gym consistency this week and what should I focus on for recovery?');
    } else if (activeTab === 'projects') {
      setGeminiInitialPrompt('Which project should I prioritize working on next?');
    } else if (activeTab === 'todo') {
      setGeminiInitialPrompt('What are my highest priority tasks for today?');
    } else {
      setGeminiInitialPrompt('What should I focus on today across tuition, tasks, gym, and Salah?');
    }
    setIsGeminiModalOpen(true);
  };

  const uncompletedShoppingCount = shoppingList.filter(s => !s.completed).length;

  return (
    <header className="fixed top-0 w-full z-40 bg-[#070b12]/85 backdrop-blur-2xl shadow-[0_1px_16px_rgba(0,0,0,0.4)] border-b border-[#202c3d]/30">
      <div className="w-full pt-safe">
        {/* View Header Row */}
        <div className="h-14 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-[22px] text-[#edf5ff] tracking-tight font-semibold">
              {title}
            </h1>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-1.5">
            {/* If in To-do: Quick Notes & Things to Buy */}
            {activeTab === 'todo' && (
              <>
                <button
                  onClick={() => setIsNotesModalOpen(true)}
                  aria-label="Quick Notes"
                  className="w-9 h-9 rounded-lg bg-[#0c1320] flex items-center justify-center text-[#91a2b8] hover:text-[#35d9ff] hover:bg-[#1b2a42]/70 transition-all border border-[#202c3d]/50 active:scale-95 relative"
                  title="Quick Notes"
                >
                  <span className="material-symbols-outlined text-[19px]">sticky_note_2</span>
                  {notes.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#5cffb7] shadow-[0_0_6px_#5cffb7]" />
                  )}
                </button>

                <button
                  onClick={() => setIsBuyModalOpen(true)}
                  aria-label="Things to Buy"
                  className="w-9 h-9 rounded-lg bg-[#0c1320] flex items-center justify-center text-[#91a2b8] hover:text-[#35d9ff] hover:bg-[#1b2a42]/70 transition-all border border-[#202c3d]/50 active:scale-95 relative"
                  title="Things to Buy"
                >
                  <span className="material-symbols-outlined text-[19px]">shopping_bag</span>
                  {uncompletedShoppingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#cdbdff] shadow-[0_0_6px_#cdbdff]" />
                  )}
                </button>
              </>
            )}

            {/* Gemini AI Assistant Button */}
            <button
              onClick={openGeminiWithContext}
              aria-label="AI Assistant"
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#91a2b8] hover:text-[#35d9ff] transition-all active:scale-95 group relative"
              title="Aetheris Gemini Assistant"
            >
              <span className="material-symbols-outlined text-[20px] group-hover:drop-shadow-[0_0_10px_rgba(53,217,255,0.7)]">
                auto_awesome
              </span>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#cdbdff] animate-pulse" />
            </button>

            {/* Profile / Settings Button */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              aria-label="Profile and Settings"
              className="w-9 h-9 rounded-full bg-[#0c1320] flex items-center justify-center text-[#edf5ff] hover:text-[#35d9ff] transition-colors border border-[#202c3d]/50 active:scale-95 ml-0.5"
              title="Profile & Settings"
            >
              <span className="material-symbols-outlined text-[19px]">person</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
