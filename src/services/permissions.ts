import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const NOTIF_PERMISSION_KEY = 'hifz_notification_permission';
const NETWORK_DATA_USAGE_KEY = 'hifz_network_data_usage';

export type PermissionStatus = {
  notificationsGranted: boolean;
  cellularStreamingAllowed: boolean;
  hasPrompted: boolean;
};

// Configure notification presentation handler
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  // Not supported on some platforms
}

export async function checkPermissions(): Promise<PermissionStatus> {
  let notificationsGranted = false;
  let cellularStreamingAllowed = true;
  let hasPrompted = false;

  try {
    const prompted = await AsyncStorage.getItem('hifz_permissions_prompted');
    hasPrompted = prompted === 'true';

    const cellSetting = await AsyncStorage.getItem(NETWORK_DATA_USAGE_KEY);
    if (cellSetting !== null) {
      cellularStreamingAllowed = cellSetting === 'true';
    }

    if (Platform.OS !== 'web') {
      const { status } = await Notifications.getPermissionsAsync();
      notificationsGranted = status === 'granted';
    } else {
      notificationsGranted = (await AsyncStorage.getItem(NOTIF_PERMISSION_KEY)) === 'granted';
    }
  } catch (err) {
    console.warn("Check permissions error:", err);
  }

  return {
    notificationsGranted,
    cellularStreamingAllowed,
    hasPrompted,
  };
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS !== 'web') {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      const granted = finalStatus === 'granted';
      await AsyncStorage.setItem(NOTIF_PERMISSION_KEY, granted ? 'granted' : 'denied');
      return granted;
    } else {
      await AsyncStorage.setItem(NOTIF_PERMISSION_KEY, 'granted');
      return true;
    }
  } catch (err) {
    console.warn("Request notification permission error:", err);
    await AsyncStorage.setItem(NOTIF_PERMISSION_KEY, 'granted');
    return true;
  }
}

export async function setCellularStreamingAllowed(allowed: boolean): Promise<void> {
  await AsyncStorage.setItem(NETWORK_DATA_USAGE_KEY, allowed ? 'true' : 'false');
}

export async function markPermissionsPrompted(): Promise<void> {
  await AsyncStorage.setItem('hifz_permissions_prompted', 'true');
}

export async function scheduleDailyHifzReminder(): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "📖 Daily Qur'an Memorization",
        body: "Time for your daily Hifz and revision practice! Tap to continue your streak.",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });
  } catch (e) {
    console.warn("Could not schedule daily reminder:", e);
  }
}
