import React from 'react';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import { cycleRepeat, setDelay, setLoopRange, setRepeatTarget } from '@/services/audio';

export default function RepeatSettingsModal({
  visible,
  repeatTarget,
  delaySeconds,
  isLoopRange,
  onClose,
}: {
  visible: boolean;
  repeatTarget: number;
  delaySeconds: number;
  isLoopRange: boolean;
  onClose: () => void;
}) {
  const repeatCounts = [
    { label: '1x (Off)', value: 1 },
    { label: '2x', value: 2 },
    { label: '3x (Sunnah)', value: 3 },
    { label: '5x', value: 5 },
    { label: '10x', value: 10 },
    { label: '∞ Loop Ayah', value: Infinity },
  ];

  const delays = [0, 1, 2, 3, 5];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="repeat" size={22} color={colors.primary} />
              <Text style={styles.title}>Recitation Repeat Settings</Text>
            </View>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Repeat per Ayah */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Repeat Each Ayah (Verse):</Text>
            <View style={styles.grid}>
              {repeatCounts.map((item) => {
                const isSelected = repeatTarget === item.value && (!isLoopRange || item.value !== 1);
                return (
                  <Pressable
                    key={String(item.value)}
                    style={[
                      styles.choiceBtn,
                      isSelected && styles.choiceBtnActive,
                      item.value === Infinity && isSelected && { backgroundColor: colors.accent },
                    ]}
                    onPress={() => setRepeatTarget(item.value)}
                  >
                    <Text style={[styles.choiceBtnText, isSelected && styles.choiceBtnTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Pause Delay */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Pause Delay Between Verses (recite along):</Text>
            <View style={styles.delayRow}>
              {delays.map((s) => {
                const isSelected = delaySeconds === s;
                return (
                  <Pressable
                    key={String(s)}
                    style={[styles.delayBtn, isSelected && styles.choiceBtnActive]}
                    onPress={() => setDelay(s)}
                  >
                    <Text style={[styles.choiceBtnText, isSelected && styles.choiceBtnTextActive]}>
                      {s}s
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Loop entire Surah */}
          <View style={styles.loopCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.loopTitle}>Loop Entire Surah Continuously</Text>
              <Text style={styles.loopSub}>Replays the full Surah from verse 1 when finished</Text>
            </View>
            <Switch
              value={isLoopRange}
              onValueChange={(val) => setLoopRange(val)}
              trackColor={{ false: colors.border, true: colors.primarySoft }}
              thumbColor={isLoopRange ? colors.primary : '#f4f3f4'}
            />
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            <Pressable style={styles.quickCycleBtn} onPress={() => cycleRepeat()}>
              <Ionicons name="sync-outline" size={16} color={colors.primary} />
              <Text style={styles.quickCycleText}>Quick Cycle</Text>
            </Pressable>

            <Pressable style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  box: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceBtn: {
    flexBasis: '31%',
    flexGrow: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  choiceBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  choiceBtnTextActive: {
    color: '#fff',
  },
  delayRow: {
    flexDirection: 'row',
    gap: 6,
  },
  delayBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: 10,
  },
  loopTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  loopSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickCycleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickCycleText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  doneBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: radius.sm,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
