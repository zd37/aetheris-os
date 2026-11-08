import { NotificationPreferences } from '../types';

export const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  enabled: true,
  morningEnabled: true,
  morningTime: '09:00',
  eveningEnabled: true,
  eveningTime: '20:00',
  soundEnabled: true,
};

export const MORNING_MESSAGES = [
  "Hey hey hey! Your tasks aren't going to finish themselves. Get moving!",
  "Good morning! Your to-do list is staring at you. Don't disappoint it.",
  "Rise and shine! Your future successful self is waiting.",
  "Enough scrolling. Go make some progress!",
  "System Boot: Morning focus window open. Conquer your #1 priority now!",
  "Wake up! Another day, another set of tasks to dominate. Let's go!",
  "Morning telemetry green. 0 completed tasks so far—time to change that!",
];

export const EVENING_MESSAGES = [
  "Hey! How many tasks did you defeat today?",
  "The day is almost over. Don't let your to-do list win.",
  "One more task. Come on, you've got this!",
  "Your bed is waiting, but so are those unfinished tasks!",
  "Evening debrief: Clear your remaining items or carry them forward into tomorrow.",
  "Almost lights out! Log your gym, check off your Salah, and review your day.",
  "Victory lap time! Did you crush today's focus goals?",
];

/**
 * Returns a randomized or day-indexed motivational message
 */
export function getMotivationalMessage(type: 'morning' | 'evening'): string {
  const list = type === 'morning' ? MORNING_MESSAGES : EVENING_MESSAGES;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const index = (dayOfYear + new Date().getHours()) % list.length;
  return list[index];
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (e) {
    return 'denied';
  }
}

/**
 * Check if notifications are currently permitted
 */
export function getNotificationPermissionStatus(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Show a local system notification (used when service worker or desktop/Android allows it)
 */
export function displaySystemNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'aetheris-daily-motivation',
        });
      });
    } else {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'aetheris-daily-motivation',
      });
    }
  } catch (e) {
    console.warn('[Aetheris Notification] Could not display notification:', e);
  }
}
