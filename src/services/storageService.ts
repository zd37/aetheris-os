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
  ActiveTab,
} from '../types';

export const CANONICAL_STORAGE_KEY = 'aetheris_os_state_v2';
const LEGACY_STORAGE_KEYS = [
  'aetheris_os_state_v2',
  'aetheris_os_state_v1',
  'aetheris_os_state',
  'aetheris_state',
  'aetheris',
];

const DB_NAME = 'aetheris_os_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';

export interface FullPersistedState {
  preferences: UserPreferences;
  salahRecords: Record<string, SalahDayRecord>;
  students: Student[];
  attendance: AttendanceRecord[];
  payments: TuitionPayment[];
  gymGoal: number;
  gymLogs: Record<string, boolean>;
  workoutPlans: GymWorkoutPlan[];
  activeWorkoutPlanId: string;
  tasks: TaskItem[];
  notes: QuickNote[];
  shoppingList: ShoppingItem[];
  projects: ProjectItem[];
  activeTab?: ActiveTab;
}

export const DEFAULT_GYM_PLAN: GymWorkoutPlan = {
  id: 'plan-push',
  title: 'Upper Body Push (45m)',
  focus: 'Chest, Shoulders & Triceps',
  restTimerSeconds: 90,
  exercises: [
    { id: 'ex-1', name: 'Incline Dumbbell Press', sets: 4, reps: '8–10 reps', weight: '30 kg', completed: false },
    { id: 'ex-2', name: 'Overhead Shoulder Press', sets: 3, reps: '8 reps', weight: '45 kg', completed: false },
    { id: 'ex-3', name: 'Chest Dips', sets: 3, reps: '10 reps', weight: 'Bodyweight', completed: false },
    { id: 'ex-4', name: 'Lateral Cable Raises', sets: 4, reps: '15 reps', weight: 'Dumbbells', completed: false },
  ],
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  name: '',
  onboardingCompleted: false,
  weeklyGymTarget: 4,
  prayerReminders: true,
  theme: 'dark',
  enabledSections: ['home', 'tuition', 'gym', 'todo', 'money', 'projects'],
};

// Open IndexedDB instance safely (supports fallback if IDB is blocked)
function openDB(): Promise<IDBDatabase | null> {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = err => {
        console.warn('[Aetheris Storage] IndexedDB open error, using localStorage fallback:', err);
        resolve(null);
      };

      request.onblocked = () => {
        console.warn('[Aetheris Storage] IndexedDB open blocked');
        resolve(null);
      };
    } catch (e) {
      console.warn('[Aetheris Storage] IndexedDB initialization exception:', e);
      resolve(null);
    }
  });
}

// Get value from IndexedDB
export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    if (!db) return null;

    return new Promise(resolve => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        resolve(req.result !== undefined ? (req.result as T) : null);
      };
      req.onerror = () => {
        resolve(null);
      };
    });
  } catch (e) {
    return null;
  }
}

// Set value in IndexedDB
export async function idbSet<T>(key: string, value: T): Promise<boolean> {
  try {
    const db = await openDB();
    if (!db) return false;

    return new Promise(resolve => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);

      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    });
  } catch (e) {
    return false;
  }
}

// Safe localStorage getter
export function localGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    return fallback;
  }
}

// Safe localStorage setter
export function localSet<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn(`[Aetheris Storage] localStorage set failed for ${key}:`, e);
    return false;
  }
}

// Request persistent storage from browser (critical for iOS Home Screen PWAs)
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        return await navigator.storage.persist();
      }
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

// Search and migrate any legacy or alternate storage keys
export function loadFromLocalStorageWithMigration(): Partial<FullPersistedState> {
  const result: Partial<FullPersistedState> = {};

  // Try each key prefix in priority order
  for (const prefix of LEGACY_STORAGE_KEYS) {
    try {
      if (!result.preferences) {
        const rawPrefs = localStorage.getItem(`${prefix}_prefs`);
        if (rawPrefs) {
          const parsed = JSON.parse(rawPrefs);
          if (parsed && typeof parsed === 'object') {
            result.preferences = {
              ...DEFAULT_PREFERENCES,
              ...parsed,
            };
          }
        }
      }

      if (!result.students) {
        const rawStudents = localStorage.getItem(`${prefix}_students`);
        if (rawStudents) {
          const parsed = JSON.parse(rawStudents);
          if (Array.isArray(parsed) && parsed.length > 0) {
            result.students = parsed;
          }
        }
      }

      if (!result.attendance) {
        const rawAttendance = localStorage.getItem(`${prefix}_attendance`);
        if (rawAttendance) {
          const parsed = JSON.parse(rawAttendance);
          if (Array.isArray(parsed) && parsed.length > 0) {
            result.attendance = parsed;
          }
        }
      }

      if (!result.payments) {
        const rawPayments = localStorage.getItem(`${prefix}_payments`);
        if (rawPayments) {
          const parsed = JSON.parse(rawPayments);
          if (Array.isArray(parsed) && parsed.length > 0) {
            result.payments = parsed;
          }
        }
      }

      if (!result.salahRecords) {
        const rawSalah = localStorage.getItem(`${prefix}_salah`);
        if (rawSalah) {
          const parsed = JSON.parse(rawSalah);
          if (parsed && typeof parsed === 'object') {
            result.salahRecords = parsed;
          }
        }
      }

      if (!result.tasks) {
        const rawTasks = localStorage.getItem(`${prefix}_tasks`);
        if (rawTasks) {
          const parsed = JSON.parse(rawTasks);
          if (Array.isArray(parsed) && parsed.length > 0) {
            result.tasks = parsed;
          }
        }
      }

      if (!result.notes) {
        const rawNotes = localStorage.getItem(`${prefix}_notes`);
        if (rawNotes) {
          const parsed = JSON.parse(rawNotes);
          if (Array.isArray(parsed) && parsed.length > 0) {
            result.notes = parsed;
          }
        }
      }

      if (!result.shoppingList) {
        const rawShopping = localStorage.getItem(`${prefix}_shopping`);
        if (rawShopping) {
          const parsed = JSON.parse(rawShopping);
          if (Array.isArray(parsed) && parsed.length > 0) {
            result.shoppingList = parsed;
          }
        }
      }

      if (!result.projects) {
        const rawProjects = localStorage.getItem(`${prefix}_projects`);
        if (rawProjects) {
          const parsed = JSON.parse(rawProjects);
          if (Array.isArray(parsed) && parsed.length > 0) {
            result.projects = parsed;
          }
        }
      }

      if (result.gymGoal === undefined) {
        const rawGoal = localStorage.getItem(`${prefix}_gym_goal`);
        if (rawGoal) {
          const parsed = JSON.parse(rawGoal);
          if (typeof parsed === 'number') {
            result.gymGoal = parsed;
          }
        }
      }

      if (!result.gymLogs) {
        const rawLogs = localStorage.getItem(`${prefix}_gym_logs`);
        if (rawLogs) {
          const parsed = JSON.parse(rawLogs);
          if (parsed && typeof parsed === 'object') {
            result.gymLogs = parsed;
          }
        }
      }

      if (!result.workoutPlans) {
        const rawPlans = localStorage.getItem(`${prefix}_workout_plans`);
        if (rawPlans) {
          const parsed = JSON.parse(rawPlans);
          if (Array.isArray(parsed) && parsed.length > 0) {
            result.workoutPlans = parsed;
          }
        }
      }

      if (!result.activeWorkoutPlanId) {
        const rawPlanId = localStorage.getItem(`${prefix}_active_workout_plan_id`);
        if (rawPlanId) {
          const parsed = JSON.parse(rawPlanId);
          if (typeof parsed === 'string' && parsed) {
            result.activeWorkoutPlanId = parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[Aetheris Storage] Migration read error for prefix:', prefix, e);
    }
  }

  return result;
}

// Load entire state with dual reconciliation (localStorage + IndexedDB)
export async function loadInitialFullState(): Promise<FullPersistedState> {
  // 1. Initial fast read from localStorage (with legacy migration)
  const localState = loadFromLocalStorageWithMigration();

  // 2. Read authoritative persistence from IndexedDB
  const idbState = await idbGet<Partial<FullPersistedState>>('root_state');

  // 3. Reconcile: Prefer whichever store has valid, non-empty, or more complete data
  const preferences: UserPreferences =
    idbState?.preferences?.onboardingCompleted
      ? { ...DEFAULT_PREFERENCES, ...idbState.preferences }
      : localState.preferences?.onboardingCompleted
      ? { ...DEFAULT_PREFERENCES, ...localState.preferences }
      : idbState?.preferences || localState.preferences || DEFAULT_PREFERENCES;

  const students: Student[] =
    (idbState?.students && idbState.students.length > 0)
      ? idbState.students
      : (localState.students && localState.students.length > 0)
      ? localState.students
      : [];

  const attendance: AttendanceRecord[] =
    (idbState?.attendance && idbState.attendance.length > 0)
      ? idbState.attendance
      : (localState.attendance && localState.attendance.length > 0)
      ? localState.attendance
      : [];

  const payments: TuitionPayment[] =
    (idbState?.payments && idbState.payments.length > 0)
      ? idbState.payments
      : (localState.payments && localState.payments.length > 0)
      ? localState.payments
      : [];

  const salahRecords: Record<string, SalahDayRecord> =
    idbState?.salahRecords && Object.keys(idbState.salahRecords).length > 0
      ? idbState.salahRecords
      : localState.salahRecords && Object.keys(localState.salahRecords).length > 0
      ? localState.salahRecords
      : {};

  const gymGoal: number =
    idbState?.gymGoal ?? localState.gymGoal ?? preferences.weeklyGymTarget ?? 4;

  const gymLogs: Record<string, boolean> =
    idbState?.gymLogs ?? localState.gymLogs ?? {};

  const workoutPlans: GymWorkoutPlan[] =
    (idbState?.workoutPlans && idbState.workoutPlans.length > 0)
      ? idbState.workoutPlans
      : (localState.workoutPlans && localState.workoutPlans.length > 0)
      ? localState.workoutPlans
      : [DEFAULT_GYM_PLAN];

  const activeWorkoutPlanId: string =
    idbState?.activeWorkoutPlanId ?? localState.activeWorkoutPlanId ?? DEFAULT_GYM_PLAN.id;

  const tasks: TaskItem[] =
    (idbState?.tasks && idbState.tasks.length > 0)
      ? idbState.tasks
      : (localState.tasks && localState.tasks.length > 0)
      ? localState.tasks
      : [];

  const notes: QuickNote[] =
    (idbState?.notes && idbState.notes.length > 0)
      ? idbState.notes
      : (localState.notes && localState.notes.length > 0)
      ? localState.notes
      : [];

  const shoppingList: ShoppingItem[] =
    (idbState?.shoppingList && idbState.shoppingList.length > 0)
      ? idbState.shoppingList
      : (localState.shoppingList && localState.shoppingList.length > 0)
      ? localState.shoppingList
      : [];

  const projects: ProjectItem[] =
    (idbState?.projects && idbState.projects.length > 0)
      ? idbState.projects
      : (localState.projects && localState.projects.length > 0)
      ? localState.projects
      : [];

  const reconciled: FullPersistedState = {
    preferences,
    salahRecords,
    students,
    attendance,
    payments,
    gymGoal,
    gymLogs,
    workoutPlans,
    activeWorkoutPlanId,
    tasks,
    notes,
    shoppingList,
    projects,
  };

  // 4. Synchronize canonical keys immediately in both storage engines
  persistFullState(reconciled);

  return reconciled;
}

// Persist full state to both localStorage and IndexedDB
export function persistFullState(state: FullPersistedState) {
  // 1. Write to localStorage
  localSet(`${CANONICAL_STORAGE_KEY}_prefs`, state.preferences);
  localSet(`${CANONICAL_STORAGE_KEY}_salah`, state.salahRecords);
  localSet(`${CANONICAL_STORAGE_KEY}_students`, state.students);
  localSet(`${CANONICAL_STORAGE_KEY}_attendance`, state.attendance);
  localSet(`${CANONICAL_STORAGE_KEY}_payments`, state.payments);
  localSet(`${CANONICAL_STORAGE_KEY}_gym_goal`, state.gymGoal);
  localSet(`${CANONICAL_STORAGE_KEY}_gym_logs`, state.gymLogs);
  localSet(`${CANONICAL_STORAGE_KEY}_workout_plans`, state.workoutPlans);
  localSet(`${CANONICAL_STORAGE_KEY}_active_workout_plan_id`, state.activeWorkoutPlanId);
  localSet(`${CANONICAL_STORAGE_KEY}_tasks`, state.tasks);
  localSet(`${CANONICAL_STORAGE_KEY}_notes`, state.notes);
  localSet(`${CANONICAL_STORAGE_KEY}_shopping`, state.shoppingList);
  localSet(`${CANONICAL_STORAGE_KEY}_projects`, state.projects);

  // 2. Write to IndexedDB
  idbSet('root_state', state);
  idbSet('last_saved_at', new Date().toISOString());
}
