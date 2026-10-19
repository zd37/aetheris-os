import { TaskItem } from '../types';

export type ProductivityStage =
  | 'excellent'        // 100% complete (Green)
  | 'good'             // 75% to <100% complete (Yellow)
  | 'partial'          // 40% to <75% complete (Orange)
  | 'needs_attention'  // >0% to <40% (or 0% with tasks) (Red)
  | 'neutral'          // No tasks / future date without completion judgment
  | 'future_scheduled'; // Future date with planned tasks

export interface DayProductivity {
  date: string;
  totalEligible: number;
  completed: number;
  percentage: number;
  stage: ProductivityStage;
  label: string;
  isFuture: boolean;
  isToday: boolean;
  hasTasks: boolean;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  cellBg: string;
  cellBorder: string;
  textColor: string;
}

/**
 * Returns eligible daily tasks for a given date string YYYY-MM-DD.
 * By specification, only includes daily tasks belonging to that date.
 */
export function getEligibleTasksForDate(tasks: TaskItem[], dateStr: string, todayStr: string): TaskItem[] {
  return tasks.filter(task => {
    // Only daily tasks count toward daily productivity percentage
    if (task.period !== 'daily') return false;

    if (task.dueDate === dateStr) return true;

    // Backward-compatibility: if task has no dueDate and the date is today, attribute to today
    if (!task.dueDate && dateStr === todayStr) return true;

    return false;
  });
}

/**
 * Calculates the exact productivity metrics and 4-stage color classification
 * for any given date based on actual saved tasks.
 */
export function calculateDayProductivity(
  tasks: TaskItem[],
  dateStr: string,
  todayStr: string
): DayProductivity {
  const eligible = getEligibleTasksForDate(tasks, dateStr, todayStr);
  const totalEligible = eligible.length;
  const completed = eligible.filter(t => t.completed).length;
  const isFuture = dateStr > todayStr;
  const isToday = dateStr === todayStr;
  const hasTasks = totalEligible > 0;

  // Handle future dates: neutral calendar appearance without implying unproductivity
  if (isFuture) {
    return {
      date: dateStr,
      totalEligible,
      completed,
      percentage: totalEligible > 0 ? Math.round((completed / totalEligible) * 100) : 0,
      stage: totalEligible > 0 ? 'future_scheduled' : 'neutral',
      label: totalEligible > 0 ? `${totalEligible} Scheduled` : 'No Tasks',
      isFuture: true,
      isToday: false,
      hasTasks,
      badgeBg: 'bg-[#162338]/60',
      badgeText: 'text-[#91a2b8]',
      badgeBorder: 'border-[#202c3d]',
      dotColor: totalEligible > 0 ? 'bg-[#35d9ff]' : 'bg-transparent',
      cellBg: 'bg-[#090f19]/40 hover:bg-[#162338]/50',
      cellBorder: 'border-[#202c3d]/30',
      textColor: 'text-[#91a2b8]',
    };
  }

  // Handle days with zero recorded tasks: neutral dark gray
  if (totalEligible === 0) {
    return {
      date: dateStr,
      totalEligible: 0,
      completed: 0,
      percentage: 0,
      stage: 'neutral',
      label: 'No Tasks',
      isFuture: false,
      isToday,
      hasTasks: false,
      badgeBg: 'bg-[#0c1320]',
      badgeText: 'text-[#91a2b8]',
      badgeBorder: 'border-[#202c3d]/40',
      dotColor: 'bg-transparent',
      cellBg: 'bg-[#090f19]/60 hover:bg-[#162338]/50',
      cellBorder: 'border-[#202c3d]/30',
      textColor: isToday ? 'text-[#35d9ff]' : 'text-[#91a2b8]',
    };
  }

  // Completion calculation: (completed / total) * 100
  const percentage = Math.round((completed / totalEligible) * 100);

  // Stage 1 — Excellent: Green (100% complete)
  if (percentage === 100) {
    return {
      date: dateStr,
      totalEligible,
      completed,
      percentage: 100,
      stage: 'excellent',
      label: 'Excellent',
      isFuture: false,
      isToday,
      hasTasks: true,
      badgeBg: 'bg-[#5cffb7]/15',
      badgeText: 'text-[#5cffb7]',
      badgeBorder: 'border-[#5cffb7]/40',
      dotColor: 'bg-[#5cffb7]',
      cellBg: 'bg-[#5cffb7]/10 hover:bg-[#5cffb7]/20',
      cellBorder: 'border-[#5cffb7]/30',
      textColor: 'text-[#5cffb7]',
    };
  }

  // Stage 2 — Good: Yellow (75% to less than 100%)
  if (percentage >= 75) {
    return {
      date: dateStr,
      totalEligible,
      completed,
      percentage,
      stage: 'good',
      label: 'Good',
      isFuture: false,
      isToday,
      hasTasks: true,
      badgeBg: 'bg-[#facc15]/15',
      badgeText: 'text-[#facc15]',
      badgeBorder: 'border-[#facc15]/40',
      dotColor: 'bg-[#facc15]',
      cellBg: 'bg-[#facc15]/10 hover:bg-[#facc15]/20',
      cellBorder: 'border-[#facc15]/30',
      textColor: 'text-[#facc15]',
    };
  }

  // Stage 3 — Partial: Orange (40% to less than 75%)
  if (percentage >= 40) {
    return {
      date: dateStr,
      totalEligible,
      completed,
      percentage,
      stage: 'partial',
      label: 'Partial',
      isFuture: false,
      isToday,
      hasTasks: true,
      badgeBg: 'bg-[#fb923c]/15',
      badgeText: 'text-[#fb923c]',
      badgeBorder: 'border-[#fb923c]/40',
      dotColor: 'bg-[#fb923c]',
      cellBg: 'bg-[#fb923c]/10 hover:bg-[#fb923c]/20',
      cellBorder: 'border-[#fb923c]/30',
      textColor: 'text-[#fb923c]',
    };
  }

  // Stage 4 — Needs Attention: Red (0% or >0% and <40%)
  return {
    date: dateStr,
    totalEligible,
    completed,
    percentage,
    stage: 'needs_attention',
    label: 'Needs Attention',
    isFuture: false,
    isToday,
    hasTasks: true,
    badgeBg: 'bg-[#ff5c78]/15',
    badgeText: 'text-[#ff5c78]',
    badgeBorder: 'border-[#ff5c78]/40',
    dotColor: 'bg-[#ff5c78]',
    cellBg: 'bg-[#ff5c78]/10 hover:bg-[#ff5c78]/20',
    cellBorder: 'border-[#ff5c78]/30',
    textColor: 'text-[#ff5c78]',
  };
}
