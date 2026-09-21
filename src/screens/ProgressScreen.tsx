import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '@/components/Screen';
import StatCard from '@/components/StatCard';
import { useAppState } from '@/context/AppStateContext';
import { useQuranCatalog } from '@/context/QuranCatalogContext';
import { colors, radius, spacing } from '@/theme';
import AudioPlayerBar from '@/components/AudioPlayerBar';

export default function ProgressScreen() {
  const { chapters } = useQuranCatalog();
  const { progress } = useAppState();
  const memorizedCount = Object.keys(progress.memorizedAyahs).length;
  const totalAyahs = chapters.reduce((sum, surah) => sum + (surah.ayahCount || surah.ayahs.length || 0), 0) || 6236;
  const completion = totalAyahs === 0 ? 0 : Math.round((memorizedCount / totalAyahs) * 100);
  const history = progress.studyHistory.slice(0, 10);

  return (
    <View style={styles.screenWrapper}>
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.kicker}>ANALYTICS & HIFZ GOALS</Text>
            <Text style={styles.title}>Your Progress</Text>
            <Text style={styles.subtitle}>
              Track your memorized verses, review consistency, and study history.
            </Text>
          </View>

          <View style={styles.grid}>
            <StatCard
              title="Memorized"
              value={memorizedCount}
              subtitle={`${completion}% of the Holy Qur'an`}
              icon={<Ionicons name="checkbox-outline" size={22} color={colors.success} />}
            />
            <StatCard
              title="Daily Streak"
              value={`${progress.dailyStreak}`}
              subtitle="Days in a row"
              icon={<Ionicons name="flame-outline" size={22} color={colors.warning} />}
            />
          </View>

          <View style={styles.grid}>
            <StatCard
              title="Surahs Studied"
              value={Object.keys(progress.completedSurahs).length}
              subtitle="Chapters active"
              icon={<Ionicons name="book-outline" size={22} color={colors.primary} />}
            />
            <StatCard
              title="Study Sessions"
              value={history.length}
              subtitle="Logged reviews"
              icon={<Ionicons name="time-outline" size={22} color={colors.accent} />}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Study Sessions</Text>
            {history.length === 0 ? (
              <View style={styles.card}>
                <Ionicons name="journal-outline" size={32} color={colors.textMuted} style={{ alignSelf: 'center', marginBottom: 8 }} />
                <Text style={styles.cardTitle}>No history yet</Text>
                <Text style={styles.cardText}>
                  Your memorization logs and SRS review scores will appear here after your first study session.
                </Text>
              </View>
            ) : (
              history.map((entry) => (
                <View key={entry.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardTitle}>Surah {entry.surahId}</Text>
                    <View
                      style={[
                        styles.gradeBadge,
                        {
                          backgroundColor:
                            entry.grade === 'correct'
                              ? colors.primarySubtle
                              : entry.grade === 'hard'
                              ? colors.accentSubtle
                              : '#fee2e2',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.gradeBadgeText,
                          {
                            color:
                              entry.grade === 'correct'
                                ? colors.success
                                : entry.grade === 'hard'
                                ? colors.accent
                                : colors.danger,
                          },
                        ]}
                      >
                        {entry.grade.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.cardText}>
                    Reviewed on {new Date(entry.reviewedAt).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </Screen>

      <AudioPlayerBar />
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
  grid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: 8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  gradeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  gradeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardText: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
