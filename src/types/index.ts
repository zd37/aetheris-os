export type Priority = 'High' | 'Medium' | 'Low';
export type TaskCategory = 'Uni' | 'Tuition' | 'Health' | 'Personal' | 'Work';
export type ProjectStatus = 'In Progress' | 'Completed' | 'On Hold' | 'Not Started';
export type AttendanceStatus = 'completed' | 'missed' | 'rescheduled' | 'unmarked';

export type AppSection = 'home' | 'tuition' | 'gym' | 'todo' | 'projects' | 'money';
export type ActiveTab = AppSection;

export interface UserPreferences {
  name: string;
  onboardingCompleted: boolean;
  weeklyGymTarget: number;
  prayerReminders: boolean;
  theme: 'dark';
  enabledSections: AppSection[];
}

export interface Student {
  id: string;
  name: string;
  initials: string;
  gradeOrClass: string;
  school?: string;
  phone?: string;
  subjects: string[];
  monthlyTarget: number;
  monthlyFee: number; // in Bangladeshi Taka (৳)
  preferredDays: string[];
  notes?: string;
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  dueAmount: number; // ৳
  rescheduledCount?: number;
  attendanceRate?: number;
  nextSessionTime?: string;
  // Additional requested contact & guardian info
  parentName?: string;
  parentPhone?: string;
  altPhone?: string;
  address?: string;
  targetFee?: number;
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  status: AttendanceStatus;
  topic?: string;
  time?: string;
  rescheduledToDate?: string;
}

export interface TuitionPayment {
  id: string;
  studentId: string;
  studentName?: string;
  amount: number; // ৳
  paymentDate: string; // YYYY-MM-DD
  month: string; // e.g. "October 2026"
  status: 'Paid' | 'Partial';
  method?: string; // e.g. 'Cash', 'bKash', 'Nagad', 'Bank Transfer'
  notes?: string;
}

export interface SalahDayRecord {
  date: string; // YYYY-MM-DD
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

export interface GymExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  completed: boolean;
}

export interface GymWorkoutPlan {
  id: string;
  title: string;
  focus: string;
  restTimerSeconds: number;
  exercises: GymExercise[];
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  category: TaskCategory;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string;
  period: 'daily' | 'weekly' | 'monthly';
  completedAt?: string;
}

export interface QuickNote {
  id: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingItem {
  id: string;
  title: string;
  note?: string;
  price: number; // ৳
  completed: boolean;
  createdAt: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  progress: number; // 0 - 100
  nextVector: string;
  milestones: ProjectMilestone[];
  repoUrl?: string;
  docUrl?: string;
}

export interface AppDataBackup {
  version: number;
  timestamp: string;
  preferences: UserPreferences;
  students: Student[];
  attendance: AttendanceRecord[];
  payments: TuitionPayment[];
  salah: Record<string, SalahDayRecord>;
  gymPlans: GymWorkoutPlan[];
  gymLog: Record<string, boolean>; // YYYY-MM-DD -> completed
  tasks: TaskItem[];
  notes: QuickNote[];
  shopping: ShoppingItem[];
  projects: ProjectItem[];
}
