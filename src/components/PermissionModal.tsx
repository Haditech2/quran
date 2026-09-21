import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import {
  checkPermissions,
  markPermissionsPrompted,
  requestNotificationPermission,
  scheduleDailyHifzReminder,
  setCellularStreamingAllowed,
} from '@/services/permissions';

export default function PermissionModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [notifGranted, setNotifGranted] = useState(false);
  const [cellularAllowed, setCellularAllowed] = useState(true);

  useEffect(() => {
    if (visible) {
      void checkPermissions().then((status) => {
        setNotifGranted(status.notificationsGranted);
        setCellularAllowed(status.cellularStreamingAllowed);
      });
    }
  }, [visible]);

  const handleRequestNotif = async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (granted) {
      await scheduleDailyHifzReminder();
    }
  };

  const handleToggleCellular = async (value: boolean) => {
    setCellularAllowed(value);
    await setCellularStreamingAllowed(value);
  };

  const handleDone = async () => {
    await markPermissionsPrompted();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>Permissions & Usage</Text>
            <Text style={styles.subtitle}>
              Configure your notifications and network streaming permissions for optimal Qur'an memorization.
            </Text>
          </View>

          {/* Notification Permission Card */}
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={[styles.badgeIcon, { backgroundColor: notifGranted ? colors.primarySubtle : colors.surfaceMuted }]}>
                <Ionicons
                  name={notifGranted ? 'notifications' : 'notifications-outline'}
                  size={22}
                  color={notifGranted ? colors.primary : colors.textMuted}
                />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Daily Hifz Notifications</Text>
                <Text style={styles.cardDesc}>
                  Reminders for scheduled revision, weak verses, and study streaks.
                </Text>
              </View>
            </View>

            {notifGranted ? (
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.activeText}>Allowed</Text>
              </View>
            ) : (
              <Pressable style={styles.actionBtn} onPress={handleRequestNotif}>
                <Text style={styles.actionBtnText}>Allow</Text>
              </Pressable>
            )}
          </View>

          {/* Network Data Usage Permission Card */}
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={[styles.badgeIcon, { backgroundColor: colors.accentSubtle }]}>
                <Ionicons name="cellular-outline" size={22} color={colors.accent} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Cellular Audio Streaming</Text>
                <Text style={styles.cardDesc}>
                  Stream recitations and fetch live Ayahs over mobile data when Wi-Fi is unavailable.
                </Text>
              </View>
            </View>

            <Switch
              value={cellularAllowed}
              onValueChange={handleToggleCellular}
              trackColor={{ false: colors.border, true: colors.primarySoft }}
              thumbColor={cellularAllowed ? colors.primary : '#f4f3f4'}
            />
          </View>

          {/* Done / Continue Button */}
          <Pressable style={styles.submitBtn} onPress={handleDone}>
            <Text style={styles.submitBtnText}>Continue to Qur'an App</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 44, 34, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  box: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  badgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySubtle,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radius.sm,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
  },
  actionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.sm,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
