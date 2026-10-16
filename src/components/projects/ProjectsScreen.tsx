import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectDetailModal } from './ProjectDetailModal';
import { ProjectItem } from '../../types';

export const ProjectsScreen: React.FC = () => {
  const {
    projects,
    addProject,
    setIsGeminiModalOpen,
    setGeminiInitialPrompt,
  } = useApp();

  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

  // New Project form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [nextVector, setNextVector] = useState('');

  const handleAskGemini = (prompt: string) => {
    setGeminiInitialPrompt(prompt);
    setIsGeminiModalOpen(true);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addProject({
      title: title.trim(),
      description: description.trim() || 'Technical project',
      status: 'In Progress',
      nextVector: nextVector.trim() || 'Initialize project repository',
      milestones: [
        { id: `m-${Date.now()}-1`, title: 'Define scope & architecture', completed: true },
        { id: `m-${Date.now()}-2`, title: 'Core implementation', completed: false },
      ],
    });

    setTitle('');
    setDescription('');
    setNextVector('');
    setShowNewProjectModal(false);
  };

  return (
    <main className="flex flex-col relative w-full px-4 pt-header-safe pb-28 bg-[#070b12] min-h-screen">
      <div className="flex flex-col w-full space-y-5 pb-6">
        {/* Section Header Row */}
        <section className="flex items-center justify-between gap-2 pt-1">
          <div className="flex flex-col space-y-1 min-w-0">
            <h2 className="text-2xl font-bold text-[#edf5ff] tracking-tight">My Projects</h2>
            <p className="text-xs text-[#91a2b8] truncate">
              Personal, university, and technical projects
            </p>
          </div>

          <button
            onClick={() => setShowNewProjectModal(true)}
            type="button"
            className="shrink-0 flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-[#162338] hover:bg-[#1f314c] text-[#35d9ff] active:scale-95 transition-all shadow-sm border border-[#202c3d]/40"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="font-mono text-xs uppercase font-semibold tracking-wider">New</span>
          </button>
        </section>

        {/* Telemetry Indicator */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#35d9ff] animate-pulse" />
            <span className="font-mono text-[10px] text-[#91a2b8] uppercase tracking-wider">
              Active Protocols
            </span>
          </div>
          <span className="font-mono text-xs text-[#35d9ff]">
            {String(projects.length).padStart(2, '0')} TOTAL
          </span>
        </div>

        {/* Project Cards (Matches Image 9) */}
        <section className="flex flex-col space-y-3.5 w-full">
          {projects.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#91a2b8] bg-[#0c1320] rounded-2xl border border-[#202c3d]/30 space-y-2">
              <span className="material-symbols-outlined text-[#35d9ff] text-[28px]">terminal</span>
              <p>No projects added yet. Tap "+ New" to initialize your first project roadmap.</p>
            </div>
          ) : (
            projects.map(project => {
            let dotColor = 'bg-[#35d9ff]';
            let statusBadgeClass = 'bg-[#162338] text-[#35d9ff]';
            let barColor = 'bg-[#35d9ff]';
            let icon = 'subdirectory_arrow_right';

            if (project.title.includes('CSE') || project.title.includes('ML')) {
              dotColor = 'bg-[#cdbdff]';
              statusBadgeClass = 'bg-[#502cb0]/40 text-[#cdbdff]';
              barColor = 'bg-[#cdbdff]';
              icon = 'model_training';
            } else if (project.status === 'Completed') {
              dotColor = 'bg-[#5cffb7]';
              statusBadgeClass = 'bg-[#162338] text-[#5cffb7]';
              barColor = 'bg-[#5cffb7]';
              icon = 'verified';
            } else if (project.status === 'On Hold') {
              dotColor = 'bg-[#43556d]';
              statusBadgeClass = 'bg-[#162338] text-[#91a2b8]';
              barColor = 'bg-[#43556d]';
              icon = 'pause_circle';
            }

            return (
              <article
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="bg-[#0c1320] p-4 rounded-2xl shadow-md transition-all active:scale-[0.99] flex flex-col space-y-3.5 border border-[#202c3d]/40 hover:border-[#35d9ff]/30 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-semibold text-[#edf5ff] tracking-tight truncate">
                        {project.title}
                      </span>
                      <span className={`flex h-1.5 w-1.5 rounded-full ${dotColor}`} />
                    </div>
                    <p className="text-xs text-[#91a2b8] mt-1 leading-snug">
                      {project.description}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[11px] font-medium ${statusBadgeClass}`}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="flex flex-col space-y-1.5 pt-1">
                  <div className="flex justify-between items-center font-mono text-xs">
                    <span className="text-[#91a2b8]">Progress</span>
                    <span className="font-semibold text-[#edf5ff]">{project.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1f314c] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Next Vector Box */}
                <div className="bg-[#090f19] rounded-xl p-2.5 flex items-start space-x-2.5 border border-[#202c3d]/30">
                  <span className="material-symbols-outlined text-[16px] text-[#35d9ff] mt-0.5 shrink-0">
                    {icon}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-mono text-[9px] text-[#91a2b8] uppercase tracking-wider">
                      Next Vector
                    </span>
                    <span className="text-xs text-[#edf5ff] truncate mt-0.5 font-medium">
                      {project.nextVector}
                    </span>
                  </div>
                </div>
              </article>
            );
          }))}
        </section>

        {/* Gemini Copilot Card (Matches Image 9) */}
        <aside className="relative overflow-hidden rounded-2xl bg-[#162338]/80 border border-[#202c3d]/50 p-4 shadow-lg flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#35d9ff]">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              <span className="font-mono text-xs font-semibold tracking-wide text-[#edf5ff]">
                Ask Gemini about projects
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#cdbdff] uppercase tracking-widest bg-[#502cb0]/30 px-2 py-0.5 rounded">
              Copilot
            </span>
          </div>

          <button
            onClick={() => handleAskGemini('Which project should I work on next based on deadlines and completion state?')}
            type="button"
            className="w-full text-left bg-[#0c1320] hover:bg-[#070b12] p-2.5 rounded-xl flex items-center justify-between group active:scale-[0.98] transition-all border border-[#202c3d]/40"
          >
            <div className="flex items-center space-x-2 min-w-0 pr-2">
              <span className="material-symbols-outlined text-[16px] text-[#35d9ff]">
                lightbulb
              </span>
              <span className="text-xs text-[#35d9ff] truncate">
                Which project should I work on next?
              </span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#91a2b8] group-hover:text-[#35d9ff] transition-colors shrink-0">
              arrow_forward
            </span>
          </button>
        </aside>
      </div>

      {/* Project Details / Milestones Modal */}
      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowNewProjectModal(false)}
          />
          <div className="relative z-10 w-full max-w-sm bg-[#0c1320] border border-[#202c3d] rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-[#edf5ff]">Initialize New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-3">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-mono text-[#91a2b8]">PROJECT TITLE</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Smart Energy Meter IoT"
                  className="bg-[#070b12] border border-[#202c3d] rounded-lg px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-mono text-[#91a2b8]">DESCRIPTION</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Brief objective..."
                  className="bg-[#070b12] border border-[#202c3d] rounded-lg px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-mono text-[#91a2b8]">NEXT VECTOR ACTION</label>
                <input
                  type="text"
                  value={nextVector}
                  onChange={e => setNextVector(e.target.value)}
                  placeholder="Immediate next step..."
                  className="bg-[#070b12] border border-[#202c3d] rounded-lg px-3 py-2 text-xs text-[#edf5ff] focus:outline-none focus:border-[#35d9ff]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-3 py-1.5 text-xs font-mono text-[#91a2b8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#35d9ff] text-[#003641] font-semibold text-xs font-mono shadow-md"
                >
                  Initialize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
