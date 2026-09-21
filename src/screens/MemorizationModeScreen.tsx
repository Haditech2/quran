import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Screen from '@/components/Screen';
import { useAppState } from '@/context/AppStateContext';
import { useQuranCatalog } from '@/context/QuranCatalogContext';
import { playAyah } from '@/services/audio';
import { colors, radius, spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';
import AudioPlayerBar from '@/components/AudioPlayerBar';

type Props = NativeStackScreenProps<RootStackParamList, 'MemorizationMode'>;

type PracticeMode = 'read' | 'hide' | 'listen' | 'test';

export default function MemorizationModeScreen({ route, navigation }: Props) {
  const { progress, markAyahGrade } = useAppState();
  const { getSurahById, refreshSurah } = useQuranCatalog();
  const surah = getSurahById(route.params.surahId);
  const [mode, setMode] = useState<PracticeMode>('hide');
  const [revealed, setRevealed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const startAyah = route.params.startAyah;
    if (!surah || !startAyah) return 0;
    const index = surah.ayahs.findIndex((ayah) => ayah.number === startAyah);
    return index < 0 ? 0 : index;
  });

  React.useEffect(() => {
    void refreshSurah(route.params.surahId);
  }, [refreshSurah, route.params.surahId]);

  if (!surah || !surah.ayahs.length) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.title}>No verses available</Text>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go back</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const ayah = surah.ayahs[currentIndex] || surah.ayahs[0];
  const memorizedCount = surah.ayahs.filter((item) => progress.memorizedAyahs[item.id]).length;
  const completion = Math.round((memorizedCount / surah.ayahs.length) * 100);

  const handleGrade = (grade: 'correct' | 'hard' | 'wrong') => {
    markAyahGrade({ surahId: surah.id, ayahId: ayah.id, ayahNumber: ayah.number, grade });
    setRevealed(false);
    if (currentIndex < surah.ayahs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePlayCurrent = () => {
    void playAyah(ayah, surah.ayahs);
  };

  return (
    <View style={styles.screenWrapper}>
      <Screen>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Pressable style={styles.backNav} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={18} color={colors.primary} />
                <Text style={styles.backNavText}>Back</Text>
              </Pressable>
              <Text style={styles.arabicSurahName}>{surah.nameArabic}</Text>
            </View>

            <Text style={styles.surahTitle}>Surah {surah.nameEnglish}</Text>
            <Text style={styles.surahMeta}>
              Ayah {ayah.number} of {surah.ayahs.length} • {completion}% Memorized
            </Text>

            {/* Mode Selector Tabs (matching web version) */}
            <View style={styles.modeTabs}>
              {(['read', 'hide', 'listen', 'test'] as PracticeMode[]).map((m) => {
                const isActive = mode === m;
                const labels: Record<PracticeMode, string> = {
                  read: 'Read',
                  hide: 'Hide',
                  listen: 'Listen',
                  test: 'Test',
                };
                const icons: Record<PracticeMode, keyof typeof Ionicons.glyphMap> = {
                  read: 'book-outline',
                  hide: 'eye-off-outline',
                  listen: 'headset-outline',
                  test: 'checkmark-circle-outline',
                };

                return (
                  <Pressable
                    key={m}
                    style={[styles.modeTab, isActive && styles.modeTabActive]}
                    onPress={() => {
                      setMode(m);
                      setRevealed(false);
                      if (m === 'listen') handlePlayCurrent();
                    }}
                  >
                    <Ionicons
                      name={icons[m]}
                      size={14}
                      color={isActive ? '#fff' : colors.textMuted}
                    />
                    <Text style={[styles.modeTabText, isActive && styles.modeTabTextActive]}>
                      {labels[m]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Active Ayah Stage Card */}
          <View style={styles.stageCard}>
            <View style={styles.stageTop}>
              <View style={styles.verseBadge}>
                <Text style={styles.verseBadgeText}>
                  {surah.number}:{ayah.number}
                </Text>
              </View>

              <Pressable style={styles.listenBtn} onPress={handlePlayCurrent}>
                <Ionicons name="volume-high" size={16} color={colors.primary} />
                <Text style={styles.listenBtnText}>Listen Recitation</Text>
              </Pressable>
            </View>

            {/* Arabic Text Display */}
            {mode === 'hide' && !revealed ? (
              <Pressable style={styles.hiddenPill} onPress={() => setRevealed(true)}>
                <Ionicons name="eye-outline" size={24} color={colors.accent} />
                <Text style={styles.hiddenPillTitle}>Arabic Text Concealed</Text>
                <Text style={styles.hiddenPillSub}>Recite from memory, then tap to check</Text>
              </Pressable>
            ) : mode === 'test' && !revealed ? (
              <Pressable style={styles.hiddenPill} onPress={() => setRevealed(true)}>
                <Ionicons name="help-circle-outline" size={24} color={colors.accent} />
                <Text style={styles.hiddenPillTitle}>Self-Test Mode</Text>
                <Text style={styles.hiddenPillSub}>Recite verse {ayah.number} then tap to reveal</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => (mode === 'hide' ? setRevealed(false) : null)}>
                <Text style={styles.arabicText}>{ayah.arabic}</Text>
                {mode === 'hide' ? (
                  <Text style={styles.tapToHideText}>(Tap text to conceal again)</Text>
                ) : null}
              </Pressable>
            )}

            {/* English Translation */}
            {mode !== 'test' || revealed ? (
              <Text style={styles.translationText}>{ayah.translation}</Text>
            ) : null}
          </View>

          {/* Grading Actions (Spaced Repetition / SRS) */}
          <View style={styles.gradeSection}>
            <Text style={styles.gradeSectionLabel}>Grade Your Retention:</Text>
            <View style={styles.gradeRow}>
              <Pressable style={styles.correctBtn} onPress={() => handleGrade('correct')}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
                <Text style={styles.gradeBtnText}>Memorized (100%)</Text>
              </Pressable>

              <Pressable style={styles.hardBtn} onPress={() => handleGrade('hard')}>
                <Ionicons name="alert-circle" size={16} color="#fff" />
                <Text style={styles.gradeBtnText}>Hard (Needs Review)</Text>
              </Pressable>

              <Pressable style={styles.wrongBtn} onPress={() => handleGrade('wrong')}>
                <Ionicons name="close-circle" size={16} color="#fff" />
                <Text style={styles.gradeBtnText}>Struggled</Text>
              </Pressable>
            </View>
          </View>

          {/* Navigation Controls */}
          <View style={styles.navRow}>
            <Pressable
              style={[styles.navBtn, currentIndex === 0 && { opacity: 0.5 }]}
              disabled={currentIndex === 0}
              onPress={() => {
                setRevealed(false);
                setCurrentIndex(Math.max(currentIndex - 1, 0));
              }}
            >
              <Ionicons name="arrow-back" size={16} color={colors.text} />
              <Text style={styles.navBtnText}>Previous</Text>
            </Pressable>

            <Text style={styles.navStepText}>
              {currentIndex + 1} of {surah.ayahs.length}
            </Text>

            <Pressable
              style={[styles.navBtn, currentIndex >= surah.ayahs.length - 1 && { opacity: 0.5 }]}
              disabled={currentIndex >= surah.ayahs.length - 1}
              onPress={() => {
                setRevealed(false);
                setCurrentIndex(Math.min(currentIndex + 1, surah.ayahs.length - 1));
              }}
            >
              <Text style={styles.navBtnText}>Next</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.text} />
            </Pressable>
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  backNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySubtle,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  backNavText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  arabicSurahName: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '800',
  },
  surahTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  surahMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: 12,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: 3,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: radius.sm,
  },
  modeTabActive: {
    backgroundColor: colors.primary,
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
  modeTabTextActive: {
    color: '#fff',
  },
  stageCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  stageTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  verseBadge: {
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  verseBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  listenBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  hiddenPill: {
    backgroundColor: colors.primarySubtle,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accent,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 12,
  },
  hiddenPillTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  hiddenPillSub: {
    fontSize: 12,
    color: colors.textMuted,
  },
  arabicText: {
    fontSize: 26,
    lineHeight: 48,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginVertical: 10,
    fontWeight: '600',
  },
  tapToHideText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  translationText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 10,
  },
  gradeSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  gradeSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  gradeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  correctBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.success,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  hardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.warning,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  wrongBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.danger,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  gradeBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  navBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  navStepText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radius.sm,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
