import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Screen from '@/components/Screen';
import { useAppState } from '@/context/AppStateContext';
import { useQuranCatalog } from '@/context/QuranCatalogContext';
import { colors, radius, spacing } from '@/theme';
import AudioPlayerBar from '@/components/AudioPlayerBar';
import PermissionModal from '@/components/PermissionModal';
import { checkPermissions, PermissionStatus } from '@/services/permissions';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { chapters } = useQuranCatalog();
  const { progress, dueReviews, weakAyahs } = useAppState();
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [permStatus, setPermStatus] = useState<PermissionStatus>({
    notificationsGranted: false,
    cellularStreamingAllowed: true,
    hasPrompted: false,
  });

  const memorizedCount = Object.keys(progress.memorizedAyahs).length;
  const totalAyahs = chapters.reduce((sum, surah) => sum + (surah.ayahCount || surah.ayahs.length || 0), 0) || 6236;
  const completionPct = totalAyahs === 0 ? 0 : Math.round((memorizedCount / totalAyahs) * 100);
  const nextDue = dueReviews[0];

  useEffect(() => {
    void checkPermissions().then((status) => {
      setPermStatus(status);
      // If user hasn't seen the permissions modal yet, show it!
      if (!status.hasPrompted) {
        setPermissionModalVisible(true);
      }
    });
  }, []);

  return (
    <View style={styles.screenWrapper}>
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Hero Banner Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={13} color={colors.accent} />
              <Text style={styles.heroBadgeText}>SYSTEMATIC HIFZ PLATFORM</Text>
            </View>
            <Text style={styles.heroTitle}>Qur'an Hifz & Muraja'ah</Text>
            <Text style={styles.heroSubtitle}>
              Memorize, recite, and retain the Holy Qur'an with intelligent spaced-repetition schedules.
            </Text>

            <View style={styles.heroActions}>
              <Pressable
                style={styles.heroPrimaryBtn}
                onPress={() => navigation.navigate('Surahs')}
              >
                <Ionicons name="book" size={16} color="#fff" />
                <Text style={styles.heroPrimaryBtnText}>Explore 114 Surahs</Text>
              </Pressable>

              <Pressable
                style={styles.heroSecondaryBtn}
                onPress={() => navigation.navigate('MemorizationMode', { surahId: 1 })}
              >
                <Ionicons name="school-outline" size={16} color={colors.accent} />
                <Text style={styles.heroSecondaryBtnText}>Start Memorizing</Text>
              </Pressable>
            </View>
          </View>

          {/* Permissions & Network Usage Notice Strip */}
          <Pressable
            style={styles.permissionStrip}
            onPress={() => setPermissionModalVisible(true)}
          >
            <View style={styles.permStripLeft}>
              <Ionicons
                name={permStatus.notificationsGranted ? 'notifications-circle' : 'alert-circle-outline'}
                size={20}
                color={permStatus.notificationsGranted ? colors.primary : colors.accent}
              />
              <View>
                <Text style={styles.permStripTitle}>
                  {permStatus.notificationsGranted ? 'Notifications Active' : 'Permissions & Data Usage'}
                </Text>
                <Text style={styles.permStripSub}>
                  {permStatus.cellularStreamingAllowed ? 'Cellular streaming allowed' : 'Wi-Fi only streaming'} • Tap to customize
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          {/* Stats 2x2 Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: colors.primarySubtle }]}>
                <Ionicons name="library" size={20} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{memorizedCount}</Text>
              <Text style={styles.statLabel}>Memorized Ayahs</Text>
              <Text style={styles.statMeta}>{completionPct}% of the Qur'an</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: colors.accentSubtle }]}>
                <Ionicons name="repeat" size={20} color={colors.accent} />
              </View>
              <Text style={styles.statValue}>{dueReviews.length}</Text>
              <Text style={styles.statLabel}>Due for Revision</Text>
              <Text style={styles.statMeta}>{dueReviews.length > 0 ? 'Review now' : 'All clear today'}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="flame" size={20} color="#d97706" />
              </View>
              <Text style={styles.statValue}>{progress.dailyStreak} Days</Text>
              <Text style={styles.statLabel}>Practice Streak</Text>
              <Text style={styles.statMeta}>Keep consistency</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBadge, { backgroundColor: colors.primarySubtle }]}>
                <Ionicons name="cellular-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>Live API</Text>
              <Text style={styles.statLabel}>Audio Stream</Text>
              <Text style={styles.statMeta}>Dual CDN everyayah</Text>
            </View>
          </View>

          {/* Quick Review / SRS Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Muraja'ah Schedule</Text>
              <Pressable onPress={() => navigation.navigate('Revision')}>
                <Text style={styles.sectionLink}>Open Revision →</Text>
              </Pressable>
            </View>

            <View style={styles.quickCard}>
              <View style={styles.quickCardHeader}>
                <View style={styles.srsBadge}>
                  <Text style={styles.srsBadgeText}>SPACED REPETITION (SRS)</Text>
                </View>
                <Text style={styles.quickCardMeta}>
                  {nextDue ? `Due: ${new Date(nextDue.dueAt).toLocaleDateString()}` : 'Interval 1d → 3d → 7d → 30d'}
                </Text>
              </View>
              <Text style={styles.quickCardTitle}>
                {nextDue ? `${nextDue.surahName} • Ayah ${nextDue.ayahNumber}` : 'All verses are currently up to date!'}
              </Text>
              <Text style={styles.quickCardBody}>
                {nextDue
                  ? 'Systematic revision strengthens retention. Review this verse now to keep your memory score at 100%.'
                  : 'Start practicing any Surah or use the repeat recitation tool to reinforce new verses.'}
              </Text>

              <Pressable
                style={styles.quickCardAction}
                onPress={() => navigation.navigate('Revision')}
              >
                <Ionicons name="play-circle" size={16} color="#fff" />
                <Text style={styles.quickCardActionText}>Start Muraja'ah Session</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </Screen>

      {/* Docked Sticky Bottom Audio Player Bar */}
      <AudioPlayerBar />

      <PermissionModal
        visible={permissionModalVisible}
        onClose={() => setPermissionModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
    paddingTop: 8,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroBadgeText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  heroPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  heroPrimaryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  heroSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  heroSecondaryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  permissionStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  permStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  permStripTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  permStripSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.md,
  },
  statCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 2,
  },
  statMeta: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  quickCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  quickCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  srsBadge: {
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  srsBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  quickCardMeta: {
    fontSize: 11,
    color: colors.textMuted,
  },
  quickCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  quickCardBody: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  quickCardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  quickCardActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
