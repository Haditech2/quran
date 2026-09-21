import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Screen from '@/components/Screen';
import { useAppState } from '@/context/AppStateContext';
import { colors, radius, spacing } from '@/theme';
import {
  checkPermissions,
  PermissionStatus,
  requestNotificationPermission,
  scheduleDailyHifzReminder,
  setCellularStreamingAllowed,
} from '@/services/permissions';
import PermissionModal from '@/components/PermissionModal';
import AudioPlayerBar from '@/components/AudioPlayerBar';

export default function SettingsScreen() {
  const { settings, updateSettings, resetLocalData } = useAppState();
  const [permStatus, setPermStatus] = useState<PermissionStatus>({
    notificationsGranted: false,
    cellularStreamingAllowed: true,
    hasPrompted: false,
  });
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);

  useEffect(() => {
    void checkPermissions().then(setPermStatus);
  }, []);

  const handleToggleNotif = async (val: boolean) => {
    if (val) {
      const granted = await requestNotificationPermission();
      setPermStatus((prev) => ({ ...prev, notificationsGranted: granted }));
      if (granted) {
        await scheduleDailyHifzReminder();
        Alert.alert('Notifications Enabled', 'Daily Hifz schedule and revision reminders are now active.');
      } else {
        Alert.alert('Permission Denied', 'Please enable notifications in your phone system settings.');
      }
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
      setPermStatus((prev) => ({ ...prev, notificationsGranted: false }));
    }
  };

  const handleToggleCellular = async (val: boolean) => {
    setPermStatus((prev) => ({ ...prev, cellularStreamingAllowed: val }));
    await setCellularStreamingAllowed(val);
  };

  const handleSendTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📖 Test Qur'an Reminder",
          body: 'This is a test notification from your Qur\'an Memorization App!',
          sound: true,
        },
        trigger: null, // deliver immediately
      });
      Alert.alert('Test Sent', 'A test notification was triggered. Check your phone notification tray.');
    } catch (err: any) {
      Alert.alert('Notification Error', err.message || 'Could not send test notification.');
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.kicker}>PREFERENCES</Text>
            <Text style={styles.title}>Settings & Access</Text>
            <Text style={styles.subtitle}>
              Configure study routines, notifications, network data usage, and recitation audio.
            </Text>
          </View>

          {/* PERMISSIONS & SYSTEM ACCESS SECTION */}
          <View style={styles.card}>
            <View style={styles.cardSectionHeader}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Permissions & Network Access</Text>
            </View>

            {/* Notifications Permission */}
            <View style={styles.row}>
              <View style={styles.labelWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.label}>Daily Hifz Notifications</Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: permStatus.notificationsGranted ? colors.primarySubtle : colors.surfaceMuted },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: permStatus.notificationsGranted ? colors.success : colors.textMuted },
                      ]}
                    >
                      {permStatus.notificationsGranted ? 'Active' : 'Disabled'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.helper}>
                  Receive alerts for daily revision schedules, weak verses, and practice streaks.
                </Text>
              </View>
              <Switch
                value={permStatus.notificationsGranted}
                onValueChange={handleToggleNotif}
                trackColor={{ false: colors.border, true: colors.primarySoft }}
                thumbColor={permStatus.notificationsGranted ? colors.primary : '#f4f3f4'}
              />
            </View>

            {permStatus.notificationsGranted ? (
              <Pressable style={styles.testNotifBtn} onPress={handleSendTestNotification}>
                <Ionicons name="paper-plane-outline" size={14} color={colors.primary} />
                <Text style={styles.testNotifBtnText}>Send Test Notification</Text>
              </Pressable>
            ) : null}

            <View style={styles.divider} />

            {/* Network Usage Permission */}
            <View style={styles.row}>
              <View style={styles.labelWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.label}>Cellular Audio Streaming</Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: permStatus.cellularStreamingAllowed ? colors.primarySubtle : colors.accentSubtle },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: permStatus.cellularStreamingAllowed ? colors.primary : colors.accent },
                      ]}
                    >
                      {permStatus.cellularStreamingAllowed ? 'Allowed' : 'Wi-Fi Only'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.helper}>
                  Allow fetching live Ayahs and streaming recitations over mobile data when Wi-Fi is offline.
                </Text>
              </View>
              <Switch
                value={permStatus.cellularStreamingAllowed}
                onValueChange={handleToggleCellular}
                trackColor={{ false: colors.border, true: colors.primarySoft }}
                thumbColor={permStatus.cellularStreamingAllowed ? colors.primary : '#f4f3f4'}
              />
            </View>

            <Pressable
              style={styles.openPermModalBtn}
              onPress={() => setPermissionModalVisible(true)}
            >
              <Ionicons name="options-outline" size={16} color={colors.primary} />
              <Text style={styles.openPermModalText}>Open Full Permissions Manager</Text>
            </Pressable>
          </View>

          {/* READER & STUDY SETTINGS */}
          <View style={styles.card}>
            <View style={styles.cardSectionHeader}>
              <Ionicons name="book-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Reader & Practice</Text>
            </View>

            <View style={styles.row}>
              <View style={styles.labelWrap}>
                <Text style={styles.label}>Show Translation</Text>
                <Text style={styles.helper}>Display English translation under Arabic verses.</Text>
              </View>
              <Switch
                value={settings.showTranslation}
                onValueChange={(value) => updateSettings({ showTranslation: value })}
                trackColor={{ false: colors.border, true: colors.primarySoft }}
                thumbColor={settings.showTranslation ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>

          {/* AUDIO PLAYBACK SPEED */}
          <View style={styles.card}>
            <View style={styles.cardSectionHeader}>
              <Ionicons name="speedometer-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Recitation Playback Speed</Text>
            </View>

            <View style={styles.optionRow}>
              {[0.75, 1, 1.25, 1.5].map((rate) => (
                <Pressable
                  key={rate}
                  style={[
                    styles.rateBtn,
                    settings.playbackSpeed === rate && styles.rateBtnActive,
                  ]}
                  onPress={() => updateSettings({ playbackSpeed: rate })}
                >
                  <Text
                    style={[
                      styles.rateBtnText,
                      settings.playbackSpeed === rate && styles.rateBtnTextActive,
                    ]}
                  >
                    {rate}x
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* DATA & CACHE */}
          <View style={styles.card}>
            <View style={styles.cardSectionHeader}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={[styles.sectionTitle, { color: colors.danger }]}>Storage & Reset</Text>
            </View>
            <Text style={styles.helper}>
              Reset local progress, memorization records, and cached recitations on this phone.
            </Text>
            <Pressable
              style={styles.resetBtn}
              onPress={() => {
                Alert.alert(
                  'Reset Local Data?',
                  'This will clear stored progress and reset settings on this device.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Reset', style: 'destructive', onPress: () => void resetLocalData() },
                  ]
                );
              }}
            >
              <Ionicons name="trash" size={16} color="#fff" />
              <Text style={styles.resetBtnText}>Reset Local Data</Text>
            </Pressable>
          </View>

          {/* ABOUT */}
          <View style={styles.aboutCard}>
            <Text style={styles.aboutTitle}>Qur'an Memorization App</Text>
            <Text style={styles.aboutMeta}>Version 0.1.0 • Connected to Al-Quran Cloud & NairaHost PHP</Text>
          </View>
        </ScrollView>
      </Screen>

      <AudioPlayerBar />

      <PermissionModal
        visible={permissionModalVisible}
        onClose={() => {
          setPermissionModalVisible(false);
          void checkPermissions().then(setPermStatus);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
    paddingTop: 8,
  },
  header: {
    marginBottom: spacing.md,
  },
  kicker: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  labelWrap: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  helper: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 12,
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySubtle,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    marginTop: 8,
  },
  testNotifBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  openPermModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 9,
    marginTop: 14,
  },
  openPermModalText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rateBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  rateBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  rateBtnTextActive: {
    color: '#fff',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.danger,
    paddingVertical: 10,
    borderRadius: radius.sm,
    marginTop: 10,
  },
  resetBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  aboutCard: {
    alignItems: 'center',
    padding: spacing.md,
  },
  aboutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  aboutMeta: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
});
