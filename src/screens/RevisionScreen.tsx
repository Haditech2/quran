import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '@/components/Screen';
import { useAppState } from '@/context/AppStateContext';
import { ReviewEntry } from '@/types';
import { colors, radius, spacing } from '@/theme';
import AudioPlayerBar from '@/components/AudioPlayerBar';

export default function RevisionScreen() {
  const navigation = useNavigation<any>();
  const { dueReviews, weakAyahs } = useAppState();

  const prioritized = useMemo(() => {
    const weakIds = new Set(weakAyahs.map((entry: ReviewEntry) => entry.ayahId));
    return [...dueReviews].sort((left, right) => {
      const leftWeak = weakIds.has(left.ayahId) ? 0 : 1;
      const rightWeak = weakIds.has(right.ayahId) ? 0 : 1;
      if (leftWeak !== rightWeak) {
        return leftWeak - rightWeak;
      }
      return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
    });
  }, [dueReviews, weakAyahs]);

  return (
    <View style={styles.screenWrapper}>
      <Screen>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.kicker}>SPACED REPETITION (SRS)</Text>
          <Text style={styles.title}>Muraja'ah & Revision</Text>
          <Text style={styles.subtitle}>
            Scientific retention intervals (1d → 3d → 7d → 14d → 30d) automatically prioritize weak verses.
          </Text>
        </View>

        {/* Summary Badges */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.primarySubtle }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.summaryValue}>{prioritized.length}</Text>
            <Text style={styles.summaryLabel}>Due Today</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.accentSubtle }]}>
              <Ionicons name="warning-outline" size={18} color={colors.accent} />
            </View>
            <Text style={styles.summaryValue}>{weakAyahs.length}</Text>
            <Text style={styles.summaryLabel}>Weak Verses</Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#d97706" />
            </View>
            <Text style={styles.summaryValue}>100%</Text>
            <Text style={styles.summaryLabel}>Target Retention</Text>
          </View>
        </View>

        {prioritized.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="checkmark-done" size={32} color={colors.success} />
            </View>
            <Text style={styles.emptyTitle}>All Verses Reviewed!</Text>
            <Text style={styles.emptyText}>
              Your revision schedule is up to date. Keep practicing new verses in the Surah library, and they will be scheduled here automatically.
            </Text>
            <Pressable
              style={styles.exploreBtn}
              onPress={() => navigation.navigate('Surahs')}
            >
              <Ionicons name="book-outline" size={16} color="#fff" />
              <Text style={styles.exploreBtnText}>Practice More Surahs</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={prioritized}
            keyExtractor={(item) => item.ayahId}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }: { item: ReviewEntry }) => (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Ayah {item.ayahNumber}</Text>
                  </View>
                  <Text style={styles.dueDateText}>
                    Due: {new Date(item.dueAt).toLocaleDateString()}
                  </Text>
                </View>

                <Text style={styles.cardTitle}>{item.surahName}</Text>
                <Text style={styles.cardMeta}>
                  Previous Grade: <Text style={{ fontWeight: '800', color: item.grade === 'correct' ? colors.success : colors.warning }}>{item.grade.toUpperCase()}</Text>
                </Text>

                <Pressable
                  style={styles.reviewBtn}
                  onPress={() =>
                    navigation.navigate('MemorizationMode', {
                      surahId: item.surahId,
                      startAyah: item.ayahNumber,
                    })
                  }
                >
                  <Ionicons name="school" size={14} color="#fff" />
                  <Text style={styles.reviewBtnText}>Revise This Verse</Text>
                </Pressable>
              </View>
            )}
          />
        )}
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
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
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
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: spacing.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  dueDateText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  reviewBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: 10,
    marginTop: spacing.sm,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radius.sm,
    marginTop: 6,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
