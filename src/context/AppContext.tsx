import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserPreferences,
  Student,
  AttendanceRecord,
  TuitionPayment,
  SalahDayRecord,
  GymWorkoutPlan,
  TaskItem,
  QuickNote,
  ShoppingItem,
  ProjectItem,
  AppDataBackup,
  ActiveTab,
  AppSection,
} from '../types';

interface AppContextType {
  // Navigation & Screen
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isGeminiModalOpen: boolean;
  setIsGeminiModalOpen: (open: boolean) => void;
  geminiInitialPrompt: string;
  setGeminiInitialPrompt: (prompt: string) => void;

  // Onboarding & Preferences
  preferences: UserPreferences;
  completeOnboarding: (prefs: Partial<UserPreferences>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  resetOnboarding: () => void;

  // Salah
  salahRecords: Record<string, SalahDayRecord>;
  getTodaySalah: () => SalahDayRecord;
  togglePrayer: (prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', dateStr?: string) => void;

  // Tuition & Attendance
  students: Student[];
  attendance: AttendanceRecord[];
  payments: TuitionPayment[];
  addStudent: (student: Omit<Student, 'id' | 'initials' | 'dueAmount' | 'paymentStatus'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  recordAttendance: (date: string, studentIds: string[], status?: 'completed' | 'missed' | 'rescheduled') => void;
  removeAttendanceForDateStudent: (date: string, studentId: string) => void;
  addPayment: (payment: Omit<TuitionPayment, 'id'>) => void;
  deletePayment: (id: string) => void;
  isCalendarModalOpen: boolean;
  setIsCalendarModalOpen: (open: boolean) => void;
  selectedStudentProfileId: string | null;
  setSelectedStudentProfileId: (id: string | null) => void;

  // Gym
  gymGoal: number;
  setGymGoal: (days: number) => void;
  gymLogs: Record<string, boolean>; // date -> completed
  workoutPlans: GymWorkoutPlan[];
  activeWorkoutPlan: GymWorkoutPlan;
  setActiveWorkoutPlanId: (id: string) => void;
  toggleExercise: (exerciseId: string) => void;
  recordTodayWorkout: () => void;
  toggleGymDayLog: (dateStr: string) => void;

  // Tasks
  tasks: TaskItem[];
  addTask: (task: Omit<TaskItem, 'id'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  editTask: (id: string, updates: Partial<TaskItem>) => void;

  // Notes & Shopping
  notes: QuickNote[];
  addNote: (content: string, tags?: string[]) => void;
  editNote: (id: string, content: string, tags?: string[]) => void;
  deleteNote: (id: string) => void;

  shoppingList: ShoppingItem[];
  addShoppingItem: (title: string, price: number, note?: string) => void;
  toggleShoppingItem: (id: string) => void;
  deleteShoppingItem: (id: string) => void;

  isNotesModalOpen: boolean;
  setIsNotesModalOpen: (open: boolean) => void;
  isBuyModalOpen: boolean;
  setIsBuyModalOpen: (open: boolean) => void;

  // Projects
  projects: ProjectItem[];
  addProject: (project: Omit<ProjectItem, 'id' | 'progress'>) => void;
  updateProject: (id: string, updates: Partial<ProjectItem>) => void;
  deleteProject: (id: string) => void;
  toggleMilestone: (projectId: string, milestoneId: string) => void;
  addMilestone: (projectId: string, title: string) => void;

  // Copilot Query
  askGemini: (prompt: string) => Promise<{ reply: string; source?: string }>;

  // Backup / Restore
  exportBackup: () => AppDataBackup;
  importBackup: (backup: AppDataBackup) => boolean;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper for local date string YYYY-MM-DD
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const STORAGE_KEY = 'aetheris_os_state_v2';

const DEFAULT_GYM_PLAN: GymWorkoutPlan = {
  id: 'plan-push',
  title: "Upper Body Push (45m)",
  focus: 'Chest, Shoulders & Triceps',
  restTimerSeconds: 90,
  exercises: [
    { id: 'ex-1', name: 'Incline Dumbbell Press', sets: 4, reps: '8–10 reps', weight: '30 kg', completed: false },
    { id: 'ex-2', name: 'Overhead Shoulder Press', sets: 3, reps: '8 reps', weight: '45 kg', completed: false },
    { id: 'ex-3', name: 'Chest Dips', sets: 3, reps: '10 reps', weight: 'Bodyweight', completed: false },
    { id: 'ex-4', name: 'Lateral Cable Raises', sets: 4, reps: '15 reps', weight: 'Dumbbells', completed: false },
  ],
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState(false);
  const [geminiInitialPrompt, setGeminiInitialPrompt] = useState('');
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [selectedStudentProfileId, setSelectedStudentProfileId] = useState<string | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  // Core Data States - Defaults are empty unless saved in localStorage
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_prefs`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      name: '',
      onboardingCompleted: false, // Default to false: first time user sees welcome setup!
      weeklyGymTarget: 4,
      prayerReminders: true,
      theme: 'dark',
      enabledSections: ['home', 'tuition', 'gym', 'todo', 'money', 'projects'],
    };
  });

  const [salahRecords, setSalahRecords] = useState<Record<string, SalahDayRecord>>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_salah`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    const today = getLocalDateString();
    return {
      [today]: { date: today, fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
    };
  });

  // Start with clean empty array for students (no mock data)
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_students`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  // Single shared source of truth for tuition attendance
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_attendance`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  // Single shared source of truth for tuition payments
  const [payments, setPayments] = useState<TuitionPayment[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_payments`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  const [gymGoal, setGymGoal] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_gym_goal`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return preferences.weeklyGymTarget || 4;
  });

  const [gymLogs, setGymLogs] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_gym_logs`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  });

  const [workoutPlans, setWorkoutPlans] = useState<GymWorkoutPlan[]>([DEFAULT_GYM_PLAN]);
  const [activeWorkoutPlanId, setActiveWorkoutPlanId] = useState<string>(DEFAULT_GYM_PLAN.id);

  // Clean empty array for tasks
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_tasks`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  const [notes, setNotes] = useState<QuickNote[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_notes`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_shopping`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  const [projects, setProjects] = useState<ProjectItem[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_projects`);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  // LocalStorage Synchronizations for all personal data
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_prefs`, JSON.stringify(preferences));
    } catch (e) {}
  }, [preferences]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_salah`, JSON.stringify(salahRecords));
    } catch (e) {}
  }, [salahRecords]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_students`, JSON.stringify(students));
    } catch (e) {}
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_attendance`, JSON.stringify(attendance));
    } catch (e) {}
  }, [attendance]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_payments`, JSON.stringify(payments));
    } catch (e) {}
  }, [payments]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_gym_goal`, JSON.stringify(gymGoal));
    } catch (e) {}
  }, [gymGoal]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_gym_logs`, JSON.stringify(gymLogs));
    } catch (e) {}
  }, [gymLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_tasks`, JSON.stringify(tasks));
    } catch (e) {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_notes`, JSON.stringify(notes));
    } catch (e) {}
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_shopping`, JSON.stringify(shoppingList));
    } catch (e) {}
  }, [shoppingList]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_projects`, JSON.stringify(projects));
    } catch (e) {}
  }, [projects]);

  // Recalculate student payment status and dueAmount dynamically when payments or students change
  useEffect(() => {
    const now = new Date();
    const currentMonthStr = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const yearMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    setStudents(prevStudents =>
      prevStudents.map(student => {
        const studentPayments = payments.filter(
          p => p.studentId === student.id && (p.month === currentMonthStr || p.paymentDate.startsWith(yearMonthPrefix))
        );
        const totalPaid = studentPayments.reduce((acc, p) => acc + p.amount, 0);
        const dueAmount = Math.max(0, student.monthlyFee - totalPaid);

        let paymentStatus: 'Paid' | 'Pending' | 'Partial' = 'Pending';
        if (dueAmount === 0 && totalPaid > 0) {
          paymentStatus = 'Paid';
        } else if (totalPaid > 0 && dueAmount > 0) {
          paymentStatus = 'Partial';
        }

        // Attendance stats
        const studentAttendance = attendance.filter(a => a.studentId === student.id);
        const completedSessions = studentAttendance.filter(a => a.status === 'completed').length;
        const rescheduledCount = studentAttendance.filter(a => a.status === 'rescheduled').length;
        const missedCount = studentAttendance.filter(a => a.status === 'missed').length;
        const totalHeld = completedSessions + missedCount;
        const attendanceRate = totalHeld > 0 ? Math.round((completedSessions / totalHeld) * 100) : 100;

        return {
          ...student,
          dueAmount,
          paymentStatus,
          rescheduledCount,
          attendanceRate,
        };
      })
    );
  }, [payments, attendance]);

  // Salah methods
  const getTodaySalah = (): SalahDayRecord => {
    const today = getLocalDateString();
    if (salahRecords[today]) {
      return salahRecords[today];
    }
    return {
      date: today,
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
    };
  };

  const togglePrayer = (prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha', dateStr?: string) => {
    const targetDate = dateStr || getLocalDateString();
    setSalahRecords(prev => {
      const current = prev[targetDate] || {
        date: targetDate,
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false,
      };
      return {
        ...prev,
        [targetDate]: {
          ...current,
          [prayer]: !current[prayer],
        },
      };
    });
  };

  // Tuition methods
  const addStudent = (studentData: Omit<Student, 'id' | 'initials' | 'dueAmount' | 'paymentStatus'>) => {
    const initials = studentData.name
      .split(' ')
      .map(part => part[0])
      .filter(Boolean)
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'ST';

    const newStudent: Student = {
      ...studentData,
      id: `s-${Date.now()}`,
      initials,
      dueAmount: studentData.monthlyFee,
      paymentStatus: 'Pending',
      attendanceRate: 100,
      rescheduledCount: 0,
      monthlyTarget: studentData.monthlyTarget || 16,
    };
    setStudents(prev => [...prev, newStudent]);
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        const updated = { ...s, ...updates };
        if (updates.name) {
          updated.initials = updates.name
            .split(' ')
            .map(part => part[0])
            .filter(Boolean)
            .join('')
            .substring(0, 2)
            .toUpperCase() || s.initials;
        }
        return updated;
      })
    );
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setAttendance(prev => prev.filter(a => a.studentId !== id));
    setPayments(prev => prev.filter(p => p.studentId !== id));
  };

  // Shared attendance single source of truth
  const recordAttendance = (
    date: string,
    studentIds: string[],
    status: 'completed' | 'missed' | 'rescheduled' = 'completed'
  ) => {
    setAttendance(prev => {
      // Remove any existing records for this date and these students first to avoid duplicates
      const filtered = prev.filter(a => !(a.date === date && studentIds.includes(a.studentId)));
      const newRecords: AttendanceRecord[] = studentIds.map(studentId => ({
        id: `att-${Date.now()}-${studentId}`,
        date,
        studentId,
        status,
        topic: 'Regular lesson',
      }));
      return [...filtered, ...newRecords];
    });
  };

  const removeAttendanceForDateStudent = (date: string, studentId: string) => {
    setAttendance(prev => prev.filter(a => !(a.date === date && a.studentId === studentId)));
  };

  // Shared tuition payments single source of truth
  const addPayment = (paymentData: Omit<TuitionPayment, 'id'>) => {
    const newPayment: TuitionPayment = {
      ...paymentData,
      id: `p-${Date.now()}`,
    };
    setPayments(prev => [newPayment, ...prev]);
  };

  const deletePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  };

  // Gym methods
  const activeWorkoutPlan = workoutPlans.find(p => p.id === activeWorkoutPlanId) || workoutPlans[0];

  const toggleExercise = (exerciseId: string) => {
    setWorkoutPlans(prev =>
      prev.map(plan => {
        if (plan.id === activeWorkoutPlan.id) {
          return {
            ...plan,
            exercises: plan.exercises.map(ex =>
              ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
            ),
          };
        }
        return plan;
      })
    );
  };

  const recordTodayWorkout = () => {
    const today = getLocalDateString();
    setGymLogs(prev => ({
      ...prev,
      [today]: !prev[today],
    }));
  };

  const toggleGymDayLog = (dateStr: string) => {
    setGymLogs(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  // Task methods
  const addTask = (taskData: Omit<TaskItem, 'id'>) => {
    const newTask: TaskItem = {
      ...taskData,
      id: `t-${Date.now()}`,
    };
    setTasks(prev => [newTask, ...prev]);
  };

  const toggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const completed = !t.completed;
          return {
            ...t,
            completed,
            completedAt: completed ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
          };
        }
        return t;
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const editTask = (id: string, updates: Partial<TaskItem>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  // Notes methods
  const addNote = (content: string, tags: string[] = ['#Note']) => {
    const newNote: QuickNote = {
      id: `n-${Date.now()}`,
      content,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const editNote = (id: string, content: string, tags?: string[]) => {
    setNotes(prev =>
      prev.map(n =>
        n.id === id
          ? {
              ...n,
              content,
              tags: tags || n.tags,
              updatedAt: new Date().toISOString(),
            }
          : n
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // Shopping methods
  const addShoppingItem = (title: string, price: number, note: string = '') => {
    const newItem: ShoppingItem = {
      id: `b-${Date.now()}`,
      title,
      price,
      note,
      completed: false,
      createdAt: getLocalDateString(),
    };
    setShoppingList(prev => [newItem, ...prev]);
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingList(prev =>
      prev.map(item => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const deleteShoppingItem = (id: string) => {
    setShoppingList(prev => prev.filter(item => item.id !== id));
  };

  // Projects methods
  const addProject = (projectData: Omit<ProjectItem, 'id' | 'progress'>) => {
    const newProject: ProjectItem = {
      ...projectData,
      id: `pr-${Date.now()}`,
      progress: 0,
    };
    setProjects(prev => [newProject, ...prev]);
  };

  const updateProject = (id: string, updates: Partial<ProjectItem>) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          if (updated.milestones && updated.milestones.length > 0) {
            const completedCount = updated.milestones.filter(m => m.completed).length;
            updated.progress = Math.round((completedCount / updated.milestones.length) * 100);
          }
          return updated;
        }
        return p;
      })
    );
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const toggleMilestone = (projectId: string, milestoneId: string) => {
    setProjects(prev =>
      prev.map(project => {
        if (project.id === projectId) {
          const milestones = project.milestones.map(m =>
            m.id === milestoneId ? { ...m, completed: !m.completed } : m
          );
          const completedCount = milestones.filter(m => m.completed).length;
          const progress = Math.round((completedCount / milestones.length) * 100);
          return {
            ...project,
            milestones,
            progress,
            status: progress === 100 ? 'Completed' : project.status === 'Completed' ? 'In Progress' : project.status,
          };
        }
        return project;
      })
    );
  };

  const addMilestone = (projectId: string, title: string) => {
    setProjects(prev =>
      prev.map(project => {
        if (project.id === projectId) {
          const milestones = [...project.milestones, { id: `m-${Date.now()}`, title, completed: false }];
          const completedCount = milestones.filter(m => m.completed).length;
          const progress = Math.round((completedCount / milestones.length) * 100);
          return {
            ...project,
            milestones,
            progress,
          };
        }
        return project;
      })
    );
  };

  // Preferences & Onboarding
  const completeOnboarding = (prefs: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const updated = {
        ...prev,
        ...prefs,
        onboardingCompleted: true,
      };
      try {
        localStorage.setItem(`${STORAGE_KEY}_prefs`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...prefs };
      try {
        localStorage.setItem(`${STORAGE_KEY}_prefs`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const resetOnboarding = () => {
    setPreferences(prev => {
      const updated = { ...prev, onboardingCompleted: false };
      try {
        localStorage.setItem(`${STORAGE_KEY}_prefs`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Gemini Copilot integration (with offline/resilient fallback)
  const askGemini = async (prompt: string): Promise<{ reply: string; source?: string }> => {
    const context = {
      user: preferences.name,
      tasks: tasks.map(t => ({ title: t.title, completed: t.completed, priority: t.priority, category: t.category, dueTime: t.dueTime })),
      students: students.map(s => ({
        name: s.name,
        grade: s.gradeOrClass,
        monthlyFee: s.monthlyFee,
        dueAmount: s.dueAmount,
        paymentStatus: s.paymentStatus,
        attendanceRate: s.attendanceRate,
        nextSession: s.nextSessionTime,
      })),
      tuitionSummary: {
        totalStudents: students.length,
        totalMonthlyFees: students.reduce((a, b) => a + b.monthlyFee, 0),
        totalPendingFees: students.reduce((a, b) => a + (b.dueAmount || 0), 0),
      },
      gym: {
        weeklyGoal: gymGoal,
        completedDaysCount: Object.values(gymLogs).filter(Boolean).length,
        currentWorkout: activeWorkoutPlan.title,
      },
      salah: getTodaySalah(),
      projects: projects.map(p => ({
        title: p.title,
        status: p.status,
        progress: p.progress,
        nextVector: p.nextVector,
      })),
    };

    try {
      const res = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      return { reply: data.reply || 'No response generated.', source: data.source };
    } catch (err: any) {
      console.warn('Gemini request failed, relying on frontend copilot logic:', err);
      return {
        reply: `System Status: You have ${tasks.filter(t => !t.completed).length} pending tasks today. Next session is with ${students[0]?.name || 'a student'}. Stay focused and keep momentum!`,
        source: 'client-resilience',
      };
    }
  };

  // Backup & Restore
  const exportBackup = (): AppDataBackup => {
    return {
      version: 2,
      timestamp: new Date().toISOString(),
      preferences,
      students,
      attendance,
      payments,
      salah: salahRecords,
      gymPlans: workoutPlans,
      gymLog: gymLogs,
      tasks,
      notes,
      shopping: shoppingList,
      projects,
    };
  };

  const importBackup = (backup: AppDataBackup): boolean => {
    try {
      if (!backup) return false;
      if (backup.preferences) setPreferences(backup.preferences);
      if (backup.students) setStudents(backup.students);
      if (backup.attendance) setAttendance(backup.attendance);
      if (backup.payments) setPayments(backup.payments);
      if (backup.salah) setSalahRecords(backup.salah);
      if (backup.gymPlans) setWorkoutPlans(backup.gymPlans);
      if (backup.gymLog) setGymLogs(backup.gymLog);
      if (backup.tasks) setTasks(backup.tasks);
      if (backup.notes) setNotes(backup.notes);
      if (backup.shopping) setShoppingList(backup.shopping);
      if (backup.projects) setProjects(backup.projects);
      return true;
    } catch (e) {
      return false;
    }
  };

  const resetAllData = () => {
    setStudents([]);
    setAttendance([]);
    setPayments([]);
    setTasks([]);
    setNotes([]);
    setShoppingList([]);
    setProjects([]);
    setGymGoal(4);
    setGymLogs({});
    setWorkoutPlans([DEFAULT_GYM_PLAN]);
    try {
      localStorage.removeItem(`${STORAGE_KEY}_students`);
      localStorage.removeItem(`${STORAGE_KEY}_attendance`);
      localStorage.removeItem(`${STORAGE_KEY}_payments`);
      localStorage.removeItem(`${STORAGE_KEY}_tasks`);
      localStorage.removeItem(`${STORAGE_KEY}_notes`);
      localStorage.removeItem(`${STORAGE_KEY}_shopping`);
      localStorage.removeItem(`${STORAGE_KEY}_projects`);
      localStorage.removeItem(`${STORAGE_KEY}_gym_logs`);
      localStorage.removeItem(`${STORAGE_KEY}_gym_goal`);
      localStorage.removeItem(`${STORAGE_KEY}_prefs`);
    } catch (e) {}
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isGeminiModalOpen,
        setIsGeminiModalOpen,
        geminiInitialPrompt,
        setGeminiInitialPrompt,

        preferences,
        completeOnboarding,
        updatePreferences,
        resetOnboarding,

        salahRecords,
        getTodaySalah,
        togglePrayer,

        students,
        attendance,
        payments,
        addStudent,
        updateStudent,
        deleteStudent,
        recordAttendance,
        removeAttendanceForDateStudent,
        addPayment,
        deletePayment,
        isCalendarModalOpen,
        setIsCalendarModalOpen,
        selectedStudentProfileId,
        setSelectedStudentProfileId,

        gymGoal,
        setGymGoal,
        gymLogs,
        workoutPlans,
        activeWorkoutPlan,
        setActiveWorkoutPlanId,
        toggleExercise,
        recordTodayWorkout,
        toggleGymDayLog,

        tasks,
        addTask,
        toggleTask,
        deleteTask,
        editTask,

        notes,
        addNote,
        editNote,
        deleteNote,

        shoppingList,
        addShoppingItem,
        toggleShoppingItem,
        deleteShoppingItem,

        isNotesModalOpen,
        setIsNotesModalOpen,
        isBuyModalOpen,
        setIsBuyModalOpen,

        projects,
        addProject,
        updateProject,
        deleteProject,
        toggleMilestone,
        addMilestone,

        askGemini,
        exportBackup,
        importBackup,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
