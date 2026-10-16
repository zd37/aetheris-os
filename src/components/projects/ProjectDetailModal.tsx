import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion } from 'motion/react';
import { ProjectItem, ProjectStatus } from '../../types';

interface ProjectDetailModalProps {
  project: ProjectItem | null;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, onClose }) => {
  const { toggleMilestone, addMilestone, updateProject, deleteProject } = useApp();

  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [nextVectorInput, setNextVectorInput] = useState('');
  const [isEditingVector, setIsEditingVector] = useState(false);

  if (!project) return null;

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    addMilestone(project.id, newMilestoneTitle.trim());
    setNewMilestoneTitle('');
  };

  const handleStatusChange = (status: ProjectStatus) => {
    updateProject(project.id, { status });
  };

  const handleSaveVector = () => {
    if (!nextVectorInput.trim()) return;
    updateProject(project.id, { nextVector: nextVectorInput.trim() });
    setIsEditingVector(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="relative z-10 w-full max-w-lg bg-[#0c1320] border-t sm:border border-[#202c3d]/60 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[88vh] flex flex-col space-y-4"
      >
        <div className="w-12 h-1.5 bg-[#202c3d] rounded-full mx-auto" />

        {/* Header */}
        <div className="flex items-start justify-between pb-2 border-b border-[#202c3d]/40">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-[#edf5ff] leading-tight">
                {project.title}
              </h3>
              <span className="w-2 h-2 rounded-full bg-[#35d9ff]" />
            </div>
            <p className="text-xs text-[#91a2b8] mt-1 leading-relaxed">
              {project.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#162338] flex items-center justify-center text-[#91a2b8] hover:text-[#edf5ff]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Status Selector & Progress */}
        <div className="bg-[#090f19] p-3.5 rounded-2xl border border-[#202c3d]/40 space-y-3">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="text-[#91a2b8]">Status:</span>
            <div className="flex items-center space-x-1">
              {(['Not Started', 'In Progress', 'On Hold', 'Completed'] as ProjectStatus[]).map(
                st => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                      project.status === st
                        ? st === 'Completed'
                          ? 'bg-[#5cffb7] text-[#003823] font-bold'
                          : st === 'On Hold'
                          ? 'bg-[#43556d] text-[#edf5ff] font-bold'
                          : 'bg-[#35d9ff] text-[#003641] font-bold'
                        : 'bg-[#162338] text-[#91a2b8]'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-[#91a2b8]">Calculated Progress</span>
              <span className="text-[#35d9ff] font-bold">{project.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#1f314c] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#35d9ff] transition-all duration-300"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Next Vector Callout */}
        <div className="bg-[#090f19] p-3 rounded-xl border border-[#202c3d]/40 flex flex-col space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#91a2b8] uppercase tracking-wider">
              Next Action Vector
            </span>
            <button
              onClick={() => {
                setNextVectorInput(project.nextVector);
                setIsEditingVector(!isEditingVector);
              }}
              className="text-[#35d9ff] text-[11px] font-mono hover:underline"
            >
              {isEditingVector ? 'Cancel' : 'Edit Vector'}
            </button>
          </div>

          {isEditingVector ? (
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                value={nextVectorInput}
                onChange={e => setNextVectorInput(e.target.value)}
                className="flex-1 bg-[#0c1320] border border-[#35d9ff] rounded-lg px-2.5 py-1 text-xs text-[#edf5ff] focus:outline-none"
              />
              <button
                onClick={handleSaveVector}
                className="bg-[#5cffb7] text-[#003823] px-3 py-1 rounded-lg text-xs font-mono font-bold"
              >
                Save
              </button>
            </div>
          ) : (
            <p className="text-xs text-[#edf5ff] font-medium">{project.nextVector}</p>
          )}
        </div>

        {/* Milestones Checklist */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[36vh] pr-1">
          <div className="flex items-center justify-between">
            <h4 className="font-mono text-xs text-[#35d9ff] uppercase font-semibold">
              Milestones ({project.milestones.filter(m => m.completed).length}/{project.milestones.length})
            </h4>
          </div>

          <div className="space-y-1.5">
            {project.milestones.map(milestone => {
              const isDone = milestone.completed;
              return (
                <div
                  key={milestone.id}
                  onClick={() => toggleMilestone(project.id, milestone.id)}
                  className={`flex items-center space-x-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isDone
                      ? 'bg-[#090f19]/60 border-[#202c3d]/20 text-[#91a2b8]'
                      : 'bg-[#090f19] border-[#202c3d]/40 text-[#edf5ff] hover:bg-[#162338]'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                      isDone ? 'bg-[#5cffb7] text-[#070b12]' : 'bg-[#1f314c] text-transparent'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                  </div>
                  <span
                    className={`text-xs font-medium truncate ${
                      isDone ? 'line-through text-[#91a2b8]' : 'text-[#edf5ff]'
                    }`}
                  >
                    {milestone.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Add Milestone Form */}
          <form onSubmit={handleAddMilestone} className="flex items-center space-x-2 pt-2">
            <input
              type="text"
              value={newMilestoneTitle}
              onChange={e => setNewMilestoneTitle(e.target.value)}
              placeholder="Add next milestone..."
              className="flex-1 bg-[#090f19] border border-[#202c3d]/40 rounded-xl px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
            />
            <button
              type="submit"
              className="bg-[#162338] hover:bg-[#1f314c] text-[#35d9ff] px-3.5 py-2 rounded-xl text-xs font-mono font-semibold"
            >
              Add
            </button>
          </form>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#202c3d]/40">
          <button
            onClick={() => {
              deleteProject(project.id);
              onClose();
            }}
            className="text-xs font-mono text-[#ff5c78] hover:underline"
          >
            Archive / Delete Project
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#35d9ff] text-[#003641] font-mono text-xs font-bold shadow-md"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
