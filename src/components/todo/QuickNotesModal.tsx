import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';

export const QuickNotesModal: React.FC = () => {
  const { isNotesModalOpen, setIsNotesModalOpen, notes, addNote, editNote, deleteNote } = useApp();

  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  if (!isNotesModalOpen) return null;

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!noteContent.trim()) return;

    // Detect tags in content
    const foundTags = noteContent.match(/#[A-Za-z0-9_-]+/g) || ['#Note'];
    addNote(noteContent.trim(), foundTags);
    setNoteContent('');
  };

  const handleInsertTag = (tag: string) => {
    setNoteContent(prev => (prev ? `${prev.trim()} ${tag} ` : `${tag} `));
  };

  const handleStartEdit = (id: string, currentContent: string) => {
    setEditingNoteId(id);
    setEditingContent(currentContent);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingContent.trim()) return;
    const foundTags = editingContent.match(/#[A-Za-z0-9_-]+/g) || ['#Note'];
    editNote(id, editingContent.trim(), foundTags);
    setEditingNoteId(null);
    setEditingContent('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={() => setIsNotesModalOpen(false)}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative z-10 w-full max-w-lg bg-[#0c1320] border-t border-[#202c3d]/60 rounded-t-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col space-y-4"
      >
        <div className="w-12 h-1.5 bg-[#202c3d] rounded-full mx-auto" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#202c3d]/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5cffb7]/15 border border-[#5cffb7]/30 flex items-center justify-center text-[#5cffb7]">
              <span className="material-symbols-outlined text-[20px]">sticky_note_2</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#edf5ff] tracking-tight leading-tight">
                Quick Notes
              </h3>
              <p className="font-mono text-xs text-[#91a2b8]">Scratchpad & instant thoughts</p>
            </div>
          </div>
          <button
            onClick={() => setIsNotesModalOpen(false)}
            className="w-8 h-8 rounded-full bg-[#162338] flex items-center justify-center text-[#91a2b8] hover:text-[#edf5ff]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Input Area */}
        <div className="flex flex-col space-y-2.5">
          <textarea
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            rows={3}
            placeholder="Jot down a quick thought, formula, tuition idea, or code reminder..."
            className="w-full bg-[#090f19] text-[#edf5ff] p-3 rounded-xl text-sm leading-relaxed resize-none focus:outline-none focus:border-[#35d9ff] border border-[#202c3d]/50 placeholder-[#91a2b8]/50"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => handleInsertTag('#Idea')}
                className="bg-[#162338] hover:bg-[#1f314c] text-[#91a2b8] hover:text-[#35d9ff] px-2 py-0.5 rounded transition-colors"
              >
                #Idea
              </button>
              <button
                type="button"
                onClick={() => handleInsertTag('#Tuition')}
                className="bg-[#162338] hover:bg-[#1f314c] text-[#91a2b8] hover:text-[#35d9ff] px-2 py-0.5 rounded transition-colors"
              >
                #Tuition
              </button>
              <button
                type="button"
                onClick={() => handleInsertTag('#Code')}
                className="bg-[#162338] hover:bg-[#1f314c] text-[#91a2b8] hover:text-[#35d9ff] px-2 py-0.5 rounded transition-colors"
              >
                #Code
              </button>
              <button
                type="button"
                onClick={() => handleInsertTag('#Gym')}
                className="bg-[#162338] hover:bg-[#1f314c] text-[#91a2b8] hover:text-[#35d9ff] px-2 py-0.5 rounded transition-colors"
              >
                #Gym
              </button>
            </div>

            <button
              onClick={handleSave}
              className="bg-[#35d9ff] text-[#003641] hover:bg-[#32d8fd] px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center space-x-1.5 active:scale-95 shadow-md transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span>Save Note</span>
            </button>
          </div>
        </div>

        {/* Saved Notes List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[44vh] pr-1">
          {notes.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#91a2b8]">
              No scratchpad notes yet. Jot down your first note above.
            </div>
          ) : (
            notes.map(note => {
              const isEditing = editingNoteId === note.id;

              return (
                <div
                  key={note.id}
                  className="p-3 bg-[#090f19] rounded-xl border border-[#202c3d]/30 flex flex-col space-y-2"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingContent}
                        onChange={e => setEditingContent(e.target.value)}
                        className="w-full bg-[#0c1320] border border-[#35d9ff] rounded-lg p-2 text-xs text-[#edf5ff] focus:outline-none"
                        rows={2}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="px-2 py-1 text-[11px] font-mono text-[#91a2b8]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(note.id)}
                          className="px-3 py-1 bg-[#5cffb7] text-[#003823] rounded text-[11px] font-mono font-bold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <p className="text-xs text-[#edf5ff] leading-snug break-words">
                          {note.content}
                        </p>
                        <div className="flex items-center space-x-1 ml-2 shrink-0">
                          <button
                            onClick={() => handleStartEdit(note.id, note.content)}
                            className="text-[#91a2b8] hover:text-[#35d9ff] p-1 rounded"
                          >
                            <span className="material-symbols-outlined text-[15px]">edit</span>
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="text-[#91a2b8] hover:text-[#ff5c78] p-1 rounded"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between font-mono text-[10px] text-[#91a2b8]">
                        <span className="text-[#5cffb7]">{note.tags.join(' ')}</span>
                        <span>Saved</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
