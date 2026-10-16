import React, { useState } from 'react';
import { useApp, getLocalDateString } from '../../context/AppContext';
import { QuickNotesModal } from './QuickNotesModal';
import { ThingsToBuyModal } from './ThingsToBuyModal';
import { TaskCategory, Priority } from '../../types';

export const TodoScreen: React.FC = () => {
  const {
    tasks,
    toggleTask,
    addTask,
    deleteTask,
  } = useApp();

  const [activeSegment, setActiveSegment] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [showNewTaskPanel, setShowNewTaskPanel] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory>('Uni');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('High');
  const [newTaskDueTime, setNewTaskDueTime] = useState('11:59 PM');
  const [filterQuery, setFilterQuery] = useState('');

  // Filter tasks by active period
  const periodTasks = tasks.filter(t => t.period === activeSegment);
  const filteredTasks = periodTasks.filter(t =>
    t.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const completedCount = periodTasks.filter(t => t.completed).length;
  const totalCount = periodTasks.length;

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    addTask({
      title: newTaskTitle.trim(),
      completed: false,
      priority: newTaskPriority,
      category: newTaskCategory,
      dueDate: getLocalDateString(),
      dueTime: newTaskDueTime.trim() || undefined,
      period: activeSegment,
    });

    setNewTaskTitle('');
    setShowNewTaskPanel(false);
  };

  return (
    <main className="flex flex-col relative w-full px-4 pt-header-safe pb-28 bg-[#070b12] min-h-screen">
      <div className="flex flex-col w-full pb-4 space-y-6">
        {/* Segmented View Controller (Matches Image 3) */}
        <div className="w-full bg-[#090f19] p-1.5 rounded-2xl flex items-center justify-between border border-[#202c3d]/40 shadow-inner font-mono text-xs">
          <button
            onClick={() => setActiveSegment('daily')}
            className={`flex-1 py-2 rounded-xl transition-all duration-200 text-center font-medium ${
              activeSegment === 'daily'
                ? 'bg-[#35d9ff] text-[#003641] shadow-md font-bold'
                : 'text-[#91a2b8] hover:text-[#edf5ff]'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setActiveSegment('weekly')}
            className={`flex-1 py-2 rounded-xl transition-all duration-200 text-center font-medium ${
              activeSegment === 'weekly'
                ? 'bg-[#35d9ff] text-[#003641] shadow-md font-bold'
                : 'text-[#91a2b8] hover:text-[#edf5ff]'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setActiveSegment('monthly')}
            className={`flex-1 py-2 rounded-xl transition-all duration-200 text-center font-medium ${
              activeSegment === 'monthly'
                ? 'bg-[#35d9ff] text-[#003641] shadow-md font-bold'
                : 'text-[#91a2b8] hover:text-[#edf5ff]'
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Section Header */}
        <div className="flex flex-col space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-bold text-[#edf5ff] tracking-tight">
                {activeSegment === 'daily'
                  ? "Today's Focus"
                  : activeSegment === 'weekly'
                  ? 'Weekly Goals'
                  : 'Monthly Horizon'}
              </h2>
              <span className="bg-[#0c1320] px-2.5 py-0.5 rounded-full font-mono text-xs text-[#35d9ff] border border-[#202c3d]/40 tracking-wide">
                {completedCount}/{totalCount} Done
              </span>
            </div>

            <button
              onClick={() => setShowNewTaskPanel(!showNewTaskPanel)}
              className="flex items-center space-x-1.5 text-[#35d9ff] hover:text-[#b5edff] transition-colors py-1.5 px-3 rounded-xl bg-[#0c1320] border border-[#202c3d]/40 active:scale-95 text-xs font-mono"
            >
              <span className="material-symbols-outlined text-[18px]">
                {showNewTaskPanel ? 'close' : 'add'}
              </span>
              <span>New Task</span>
            </button>
          </div>

          {/* Quick Task Panel (Toggleable) */}
          {showNewTaskPanel && (
            <form
              onSubmit={handleAddNewTask}
              className="bg-[#0c1320] p-4 rounded-2xl border border-[#35d9ff]/30 shadow-lg flex flex-col space-y-3"
            >
              <div className="flex items-center space-x-2 bg-[#090f19] px-3 py-2.5 rounded-xl border border-[#202c3d]/40">
                <span className="material-symbols-outlined text-[#91a2b8] text-[20px]">
                  edit_note
                </span>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  placeholder="What do you need to get done?"
                  className="bg-transparent border-0 text-[#edf5ff] placeholder-[#91a2b8]/50 focus:outline-none w-full text-sm font-sans"
                />
              </div>

              {/* Tag & Category Selector */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                  {(['Uni', 'Tuition', 'Health', 'Personal'] as TaskCategory[]).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewTaskCategory(cat)}
                      className={`px-2 py-1 rounded transition-colors ${
                        newTaskCategory === cat
                          ? 'bg-[#35d9ff] text-[#003641] font-bold'
                          : 'bg-[#162338] text-[#91a2b8]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTaskPanel(false)}
                    className="px-3 py-1.5 text-[#91a2b8] hover:text-[#edf5ff] font-mono text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#35d9ff] text-[#003641] px-4 py-1.5 rounded-xl font-mono text-xs font-semibold active:scale-95 shadow-md"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Task List Rows (Matches Sketch Image 3) */}
          <div className="flex flex-col space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#91a2b8] bg-[#0c1320] rounded-2xl border border-[#202c3d]/30">
                No tasks logged for this timeframe. Tap "+ New Task" to schedule one.
              </div>
            ) : (
              filteredTasks.map(task => {
                const isChecked = task.completed;
                return (
                  <div
                    key={task.id}
                    className={`flex items-start p-4 rounded-2xl transition-all border group ${
                      isChecked
                        ? 'bg-[#0c1320]/60 border-[#202c3d]/20 opacity-75'
                        : 'bg-[#0c1320] border-[#202c3d]/40 hover:border-[#35d9ff]/30 shadow-sm'
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={() => toggleTask(task.id)}
                      className="pt-0.5 mr-3.5 cursor-pointer"
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-[#35d9ff] text-[#003641] shadow-sm'
                            : 'bg-[#162338] text-transparent hover:bg-[#1f314c]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px] font-bold">
                          check
                        </span>
                      </div>
                    </div>

                    {/* Task Title & Metadata */}
                    <div
                      onClick={() => toggleTask(task.id)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <p
                        className={`text-[15px] font-medium leading-snug break-words ${
                          isChecked ? 'line-through text-[#91a2b8]' : 'text-[#edf5ff]'
                        }`}
                      >
                        {task.title}
                      </p>

                      <div className="flex items-center space-x-2 mt-1.5 flex-wrap gap-y-1 font-mono text-[11px]">
                        {task.title.includes('Tuition Payment') ? (
                          <span className="text-[#5cffb7] flex items-center font-semibold">
                            <span className="material-symbols-outlined text-[13px] mr-1">
                              payments
                            </span>
                            ৳5,000 received
                          </span>
                        ) : task.completed ? (
                          <span className="text-[#5cffb7] flex items-center font-medium">
                            <span className="material-symbols-outlined text-[13px] mr-1">
                              check_circle
                            </span>
                            Completed {task.completedAt || 'today'}
                          </span>
                        ) : (
                          <span className="text-[#35d9ff] flex items-center">
                            <span className="material-symbols-outlined text-[13px] mr-1">
                              schedule
                            </span>
                            {task.dueTime ? `Due ${task.dueTime}` : 'Due Today'}
                          </span>
                        )}

                        <span className="text-[#43556d]">•</span>
                        <span className="text-[#91a2b8] bg-[#090f19] px-2 py-0.5 rounded">
                          {task.category === 'Uni'
                            ? 'University'
                            : task.category === 'Tuition'
                            ? 'Tuition'
                            : task.category === 'Health'
                            ? 'Gym'
                            : 'Personal Project'}
                        </span>
                      </div>
                    </div>

                    {/* Delete action */}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-[#91a2b8] hover:text-[#ff5c78] p-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete task"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Notes Modal */}
      <QuickNotesModal />

      {/* Things to Buy Modal */}
      <ThingsToBuyModal />
    </main>
  );
};
