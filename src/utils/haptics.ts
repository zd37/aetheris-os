/**
 * Haptic feedback and vibration utility for Aetheris OS.
 * Supports Web Vibration API on Android/Chromium, with graceful fallback.
 * Uses Capacitor Haptics if running in native build environment.
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export function triggerHaptic(type: HapticType = 'light') {
  if (typeof window === 'undefined') return;

  try {
    // 1. Try Capacitor native haptics if present on window/global
    const cap = (window as unknown as { Capacitor?: { Plugins?: { Haptics?: any } } })?.Capacitor;
    if (cap?.Plugins?.Haptics) {
      const haptics = cap.Plugins.Haptics;
      switch (type) {
        case 'light':
        case 'selection':
          haptics.impact?.({ style: 'LIGHT' });
          return;
        case 'medium':
          haptics.impact?.({ style: 'MEDIUM' });
          return;
        case 'heavy':
        case 'error':
          haptics.impact?.({ style: 'HEAVY' });
          return;
        case 'success':
          haptics.notification?.({ type: 'SUCCESS' });
          return;
        case 'warning':
          haptics.notification?.({ type: 'WARNING' });
          return;
      }
    }

    // 2. Web Vibration API (Supported on Android Chrome/Firefox, gracefully ignored on iOS Safari)
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      switch (type) {
        case 'light':
        case 'selection':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(22);
          break;
        case 'heavy':
          navigator.vibrate([35, 40, 20]);
          break;
        case 'success':
          navigator.vibrate([15, 30, 25]);
          break;
        case 'warning':
          navigator.vibrate([25, 40, 25]);
          break;
        case 'error':
          navigator.vibrate([40, 50, 40]);
          break;
      }
    }
  } catch (err) {
    // Fail silently without disrupting user interaction
  }
}
