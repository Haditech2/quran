import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ayah } from '@/types';
import { colors, radius, spacing } from '@/theme';
import { stripHtml } from '@/utils/text';
import PrimaryButton from '@/components/PrimaryButton';

export default function AyahCard({
  ayah,
  showTranslation,
  memorized,
  onPlay,
  onGrade,
}: {
  ayah: Ayah;
  showTranslation: boolean;
  memorized?: boolean;
  onPlay?: () => void;
  onGrade?: (grade: 'correct' | 'hard' | 'wrong') => void;
}) {
  return (
    <View style={[styles.card, memorized && styles.cardMemorized]}>
      <View style={styles.header}>
        <View style={styles.numberBadge}>
          <Text style={styles.numberText}>{ayah.number}</Text>
        </View>
        <View style={styles.actions}>
          {onPlay ? (
            <PrimaryButton label="Play" tone="ghost" onPress={onPlay} style={styles.actionButton} />
          ) : null}
        </View>
      </View>
      <Text style={styles.arabic}>{ayah.arabic}</Text>
      {ayah.transliteration ? <Text style={styles.transliteration}>{ayah.transliteration}</Text> : null}
      {showTranslation ? <Text style={styles.translation}>{stripHtml(ayah.translation)}</Text> : null}
      {onGrade ? (
        <View style={styles.gradeRow}>
          <PrimaryButton label="Correct" onPress={() => onGrade('correct')} style={styles.gradeButton} />
          <PrimaryButton label="Hard" tone="secondary" onPress={() => onGrade('hard')} style={styles.gradeButton} />
          <PrimaryButton label="Wrong" tone="danger" onPress={() => onGrade('wrong')} style={styles.gradeButton} />
        </View>
      ) : null}
      {memorized ? (
        <View style={styles.memorizedPill}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={styles.memorizedText}>Memorized</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cardMemorized: {
    borderColor: 'rgba(46, 139, 87, 0.35)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  numberBadge: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    color: colors.text,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    minHeight: 36,
    paddingHorizontal: 14,
  },
  arabic: {
    color: colors.text,
    fontSize: 26,
    lineHeight: 42,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  transliteration: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  translation: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  gradeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  gradeButton: {
    flexGrow: 1,
    minWidth: 94,
  },
  memorizedPill: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(46, 139, 87, 0.10)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  memorizedText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
});
