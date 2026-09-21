import { Platform, Alert, NativeModules, Vibration } from 'react-native';
import { LocalAppSettings } from './localDatabase';

let bellSoundObject: any = null;
let hasCheckedAudio = false;
let cachedAudio: any = null;

const getAudioModule = () => {
  if (hasCheckedAudio && cachedAudio) return cachedAudio;
  hasCheckedAudio = true;

  try {
    const av = require('expo-av');
    if (av && av.Audio) {
      cachedAudio = av.Audio;
      return cachedAudio;
    }
  } catch (err) {
    console.warn('[NotificationService] expo-av not available:', err);
  }
  return null;
};

let mealSuccessSoundObject: any = null;

/**
 * Plays the crisp crystal bell chime audio
 */
export const playBellSound = async (): Promise<void> => {
  const Audio = getAudioModule();
  if (!Audio) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    if (bellSoundObject) {
      try {
        await bellSoundObject.setPositionAsync(0);
        await bellSoundObject.playAsync();
        return;
      } catch {
        try {
          await bellSoundObject.unloadAsync();
        } catch {}
        bellSoundObject = null;
      }
    }

    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/bell_chime.wav'),
      { shouldPlay: true, volume: 1.0 }
    );
    bellSoundObject = sound;
  } catch (error) {
    console.warn('[NotificationService] Error playing bell sound chime:', error);
  }
};

/**
 * Plays an upbeat 2-tone harmonic success chime & triggers soft haptic vibration when a meal is logged
 */
export const playMealSuccessSound = async (): Promise<void> => {
  // 1. Trigger soft micro-haptic
  try {
    Vibration.vibrate(40);
  } catch {}

  // 2. Play upbeat success audio
  const Audio = getAudioModule();
  if (!Audio) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    if (mealSuccessSoundObject) {
      try {
        await mealSuccessSoundObject.setPositionAsync(0);
        await mealSuccessSoundObject.playAsync();
        return;
      } catch {
        try {
          await mealSuccessSoundObject.unloadAsync();
        } catch {}
        mealSuccessSoundObject = null;
      }
    }

    const { sound } = await Audio.Sound.createAsync(
      require('../../assets/sounds/meal_success.wav'),
      { shouldPlay: true, volume: 1.0 }
    );
    mealSuccessSoundObject = sound;
  } catch (error) {
    console.warn('[NotificationService] Error playing meal success sound:', error);
  }
};

/**
 * Celebrates hitting a daily macro or calorie goal:
 * Combines crisp bell chime audio and upbeat double-pulse haptic vibration
 */
export const playTargetHitCelebration = async (): Promise<void> => {
  // 1. Trigger upbeat rhythmic double-pulse haptic
  try {
    Vibration.vibrate([0, 60, 50, 90]);
  } catch (err) {
    console.warn('[NotificationService] Haptic vibration error:', err);
  }

  // 2. Play crisp celebratory bell chime
  await playBellSound();
};

/**
 * Safely loads the expo-notifications module with try/catch.
 */
let cachedModule: typeof import('expo-notifications') | null = null;
let hasCheckedModule = false;

export const getNotificationsModule = (): typeof import('expo-notifications') | null => {
  if (hasCheckedModule) {
    return cachedModule;
  }

  hasCheckedModule = true;

  try {
    const Notifications = require('expo-notifications');
    if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }
    cachedModule = Notifications;
    return Notifications;
  } catch (error) {
    console.warn('[NotificationService] Error loading expo-notifications:', error);
    cachedModule = null;
    return null;
  }
};

/**
 * Checks current notification permission status without prompting the user
 */
export const checkNotificationPermissions = async (): Promise<boolean> => {
  const Notifications = getNotificationsModule();
  if (!Notifications) return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

/**
 * Initializes the Android notification channel with MAX priority, sound & vibration
 */
export const setupNotificationChannel = async (): Promise<void> => {
  const Notifications = getNotificationsModule();
  if (!Notifications) return;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('meal-reminders', {
        name: 'Meal Reminders',
        description: 'Daily reminders for breakfast, lunch, and dinner',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 200, 300],
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        lightColor: '#FF5B00',
        showBadge: false,
      });
    } catch (err) {
      console.warn('[NotificationService] Failed to set notification channel:', err);
    }
  }
};

/**
 * Requests notification permissions from the OS and ensures channel is configured
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      await setupNotificationChannel();
      return true;
    }
    return false;
  } catch (error) {
    console.warn('[NotificationService] Error requesting permissions:', error);
    return false;
  }
};

/**
 * Helper to parse "08:30 AM" or "07:15 PM" string into 24-hour hour & minute numbers
 */
export const parseTimeStringToHourMinute = (timeStr: string): { hour: number; minute: number } => {
  try {
    const parts = timeStr.trim().split(' ');
    if (parts.length < 2) {
      const [h, m] = timeStr.split(':').map(Number);
      return { hour: h || 12, minute: m || 0 };
    }

    const [rawH, rawM] = parts[0].split(':').map(Number);
    const period = parts[1].toUpperCase();

    let hour = rawH;
    const minute = rawM || 0;

    if (period === 'PM' && hour < 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    return { hour, minute };
  } catch {
    return { hour: 12, minute: 0 };
  }
};

const MEAL_COPY: Record<'breakfast' | 'lunch' | 'dinner', { title: string; body: string }> = {
  breakfast: {
    title: 'Breakfast Time',
    body: 'Fuel up for the day! Remember to log your breakfast in NutriScan.',
  },
  lunch: {
    title: 'Lunch Time',
    body: 'Stay energized! Don\'t forget to scan and track your lunch.',
  },
  dinner: {
    title: 'Dinner Time',
    body: 'Time for dinner! Track your meal and wrap up your daily nutrition targets.',
  },
};

/**
 * Schedules or cancels a daily recurring meal reminder
 */
export const scheduleMealReminder = async (
  mealType: 'breakfast' | 'lunch' | 'dinner',
  timeString: string,
  enabled: boolean
): Promise<void> => {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return;
    }

    const identifier = `meal_reminder_${mealType}`;

    // 1. Cancel existing scheduled notification for this meal
    await cancelMealReminder(mealType);

    if (!enabled) {
      return;
    }

    // 2. Parse hour and minute
    const { hour, minute } = parseTimeStringToHourMinute(timeString);
    const copy = MEAL_COPY[mealType];

    // 3. Schedule recurring daily notification
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: copy.title,
        body: copy.body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { mealType, timeString },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: 'meal-reminders',
      },
    });
  } catch (error) {
    console.warn(`[NotificationService] Error scheduling ${mealType} reminder:`, error);
  }
};

/**
 * Cancels a scheduled meal reminder
 */
export const cancelMealReminder = async (
  mealType: 'breakfast' | 'lunch' | 'dinner'
): Promise<void> => {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return;
  }

  try {
    const identifier = `meal_reminder_${mealType}`;
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.warn(`[NotificationService] Error cancelling ${mealType} reminder:`, error);
  }
};

/**
 * Synchronizes all 3 meal reminders from current app settings
 */
export const syncAllMealReminders = async (settings: LocalAppSettings): Promise<void> => {
  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return;
  }

  await scheduleMealReminder('breakfast', settings.breakfast_time, settings.breakfast_enabled);
  await scheduleMealReminder('lunch', settings.lunch_time, settings.lunch_enabled);
  await scheduleMealReminder('dinner', settings.dinner_time, settings.dinner_enabled);
};

/**
 * Sends an immediate test notification with bell sound chime and device vibration
 */
export const sendTestNotification = async (): Promise<boolean> => {
  // Play crystal bell chime sound immediately
  playBellSound();

  // Always trigger device vibration
  try {
    Vibration.vibrate([0, 250, 150, 250]);
  } catch (vibErr) {
    console.warn('[NotificationService] Vibration error:', vibErr);
  }

  const Notifications = getNotificationsModule();
  if (!Notifications) {
    return true;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return false;
    }

    await setupNotificationChannel();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'NutriScan Reminder Test',
        body: 'Your notification chime and meal reminders are active!',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        channelId: 'meal-reminders',
      },
    });

    return true;
  } catch (error) {
    console.warn('[NotificationService] Error sending test notification:', error);
    return false;
  }
};
