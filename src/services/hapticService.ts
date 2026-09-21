import { Vibration, Platform } from 'react-native';

let lastWheelTickTime = 0;
// 35ms throttle interval: produces crisp, rapid discrete ticks even during fast momentum swipes
const WHEEL_TICK_THROTTLE_MS = 35;

/**
 * Triggers an ultra-short tactile mechanical tick when scrolling wheel pickers.
 * Throttled to ensure fast momentum scrolling produces crisp, discrete clicks
 * rather than a continuous motor vibration buzz.
 */
export const triggerWheelTick = (): void => {
  const now = Date.now();
  if (now - lastWheelTickTime < WHEEL_TICK_THROTTLE_MS) {
    return;
  }
  lastWheelTickTime = now;

  try {
    // 8ms micro-pulse on Android / iOS
    Vibration.vibrate(8);
  } catch {
    // Gracefully ignore on devices without vibration hardware
  }
};

/**
 * Triggers a firmer tactile snap when the wheel settles and locks into its final resting position.
 */
export const triggerWheelSnap = (): void => {
  try {
    Vibration.vibrate(16);
  } catch {}
};

/**
 * Triggers a subtle light tap for interactive controls / button presses.
 */
export const triggerLightTap = (): void => {
  try {
    Vibration.vibrate(12);
  } catch {}
};
