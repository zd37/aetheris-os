import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  source?: string;
  timestamp: string;
}

export const GeminiModal: React.FC = () => {
  const {
    isGeminiModalOpen,
    setIsGeminiModalOpen,
    geminiInitialPrompt,
    setGeminiInitialPrompt,
    askGemini,
  } = useApp();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompt chips matching Section 11 of the prompt
  const suggestedPrompts = [
    'What should I focus on today?',
    'Which tasks should I finish first?',
    'How many tuition payments are still outstanding?',
    'How is my gym consistency this week?',
    'Which project needs attention?',
  ];

  useEffect(() => {
    if (isGeminiModalOpen && geminiInitialPrompt) {
      handleSend(geminiInitialPrompt);
      setGeminiInitialPrompt('');
    }
  }, [isGeminiModalOpen, geminiInitialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isGeminiModalOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const q = (textToSend || input).trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await askGemini(q);
      const geminiMsg: ChatMessage = {
        id: `g-${Date.now()}`,
        sender: 'gemini',
        text: res.reply,
        source: res.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, geminiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `g-err-${Date.now()}`,
        sender: 'gemini',
        text: 'I could not reach the server copilot right now. Please check your network or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => setIsGeminiModalOpen(false)}
      />

      {/* Sheet / Modal */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative z-10 w-full max-w-lg bg-[#0c1320] border-t sm:border border-[#202c3d]/60 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl h-[85vh] flex flex-col justify-between"
      >
        <div className="w-12 h-1.5 bg-[#202c3d] rounded-full mx-auto" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#202c3d]/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#502cb0]/50 to-[#35d9ff]/20 border border-[#35d9ff]/40 flex items-center justify-center text-[#35d9ff] shadow-[0_0_16px_rgba(53,217,255,0.3)]">
              <span className="material-symbols-outlined text-[20px] animate-pulse">
                auto_awesome
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-semibold text-[#edf5ff] leading-tight">
                  Gemini Copilot
                </h3>
                <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#162338] text-[#cdbdff]">
                  Aetheris AI
                </span>
              </div>
              <p className="font-mono text-xs text-[#91a2b8]">
                Personal records advisor
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGeminiModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#162338] flex items-center justify-center text-[#91a2b8] hover:text-[#edf5ff]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Conversation Feed */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#162338] border border-[#35d9ff]/30 flex items-center justify-center text-[#35d9ff]">
                <span className="material-symbols-outlined text-[24px]">psychology</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#edf5ff]">
                  Grounded in your real system records
                </p>
                <p className="text-xs text-[#91a2b8] max-w-xs leading-relaxed">
                  Ask questions about student fees, attendance rates, pending tasks, weekly gym goals, and active projects.
                </p>
              </div>

              {/* Suggestions chips */}
              <div className="flex flex-col space-y-1.5 w-full pt-2">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="text-left text-xs bg-[#090f19] hover:bg-[#162338] border border-[#202c3d]/40 p-2.5 rounded-xl text-[#35d9ff] transition-all flex items-center justify-between group active:scale-[0.99]"
                  >
                    <span className="truncate">{prompt}</span>
                    <span className="material-symbols-outlined text-[14px] text-[#91a2b8] group-hover:text-[#35d9ff] shrink-0">
                      arrow_forward
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#35d9ff] text-[#003641] font-medium shadow-md'
                      : 'bg-[#090f19] text-[#edf5ff] border border-[#202c3d]/40 shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
                <span className="font-mono text-[9px] text-[#91a2b8] mt-1 px-1">
                  {msg.timestamp} {msg.source ? `• ${msg.source}` : ''}
                </span>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center space-x-2 p-3 bg-[#090f19] rounded-2xl border border-[#202c3d]/40 max-w-[70%]">
              <span className="w-2 h-2 rounded-full bg-[#35d9ff] animate-ping" />
              <span className="font-mono text-xs text-[#91a2b8]">
                Analyzing personal records...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="pt-2 border-t border-[#202c3d]/40 flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask Gemini anything about your records..."
            className="flex-1 bg-[#090f19] border border-[#202c3d]/50 rounded-xl px-3.5 py-2.5 text-xs text-[#edf5ff] placeholder-[#91a2b8]/50 focus:outline-none focus:border-[#35d9ff] font-sans"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-[#35d9ff] disabled:opacity-40 text-[#003641] flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(53,217,255,0.3)] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
