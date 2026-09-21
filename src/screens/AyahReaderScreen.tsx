import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Screen from '@/components/Screen';
import { useAppState } from '@/context/AppStateContext';
import { useQuranCatalog } from '@/context/QuranCatalogContext';
import {
  cycleRepeat,
  getPlaybackState,
  playAyah,
  PlaybackState,
  subscribePlaybackState,
} from '@/services/audio';
import { colors, radius, spacing } from '@/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';
import AudioPlayerBar from '@/components/AudioPlayerBar';
import RepeatSettingsModal from '@/components/RepeatSettingsModal';

type Props = NativeStackScreenProps<RootStackParamList, 'AyahReader'>;

export default function AyahReaderScreen({ route, navigation }: Props) {
  const { progress } = useAppState();
  const { getSurahById, refreshSurah } = useQuranCatalog();
  const surah = getSurahById(route.params.surahId);
  const [loadingSurah, setLoadingSurah] = useState(true);
  const [playback, setPlayback] = useState<PlaybackState>(getPlaybackState());
  const [repeatModalVisible, setRepeatModalVisible] = useState(false);

  useEffect(() => {
    return subscribePlaybackState((state) => {
      setPlayback({ ...state });
    });
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingSurah(true);
    void refreshSurah(route.params.surahId).finally(() => {
      if (active) {
        setLoadingSurah(false);
      }
    });
    return () => {
      active = false;
    };
  }, [refreshSurah, route.params.surahId]);

  if (!surah) {
    return (
      <Screen>
        <View style={styles.centered}>
          <Text style={styles.title}>Surah not found</Text>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>Go back</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const handlePlayAll = () => {
    if (surah.ayahs && surah.ayahs.length > 0) {
      void playAyah(surah.ayahs[0], surah.ayahs);
    }
  };

  const handlePlaySingle = (ayah: any) => {
    void playAyah(ayah, surah.ayahs);
  };

  // Format Repeat button label
  let repeatBadge = '1x';
  if (playback.repeatTarget === Infinity) repeatBadge = '∞ Ayah';
  else if (playback.repeatTarget > 1) repeatBadge = `${playback.repeatTarget}x`;
  else if (playback.isLoopRange) repeatBadge = '∞ Surah';

  return (
    <View style={styles.screenWrapper}>
      <Screen>
        {/* Reader Top Bar */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Pressable style={styles.navBackBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.navBackText}>Surahs</Text>
            </Pressable>

            <Text style={styles.headerArabicTitle}>{surah.nameArabic}</Text>
          </View>

          <View style={styles.surahInfoRow}>
            <Text style={styles.surahTitleEn}>Surah {surah.nameEnglish}</Text>
            <Text style={styles.surahMeta}>
              {surah.ayahs.length} Verses • {surah.revelationType}
            </Text>
          </View>

          {/* Quick Header Action Buttons: Play All, Repeat, Memorize */}
          <View style={styles.headerActions}>
            <Pressable style={styles.playAllBtn} onPress={handlePlayAll}>
              <Ionicons name="play" size={15} color="#fff" />
              <Text style={styles.playAllText}>Play All</Text>
            </Pressable>

            <Pressable
              style={styles.repeatHeaderBtn}
              onPress={() => setRepeatModalVisible(true)}
              onLongPress={() => cycleRepeat()}
            >
              <Ionicons name="repeat" size={15} color={colors.primary} />
              <Text style={styles.repeatHeaderText}>Repeat: {repeatBadge}</Text>
            </Pressable>

            <Pressable
              style={styles.memorizeBtn}
              onPress={() => navigation.navigate('MemorizationMode', { surahId: surah.id })}
            >
              <Ionicons name="school" size={15} color="#fff" />
              <Text style={styles.memorizeText}>Memorize</Text>
            </Pressable>
          </View>
        </View>

        {loadingSurah && surah.ayahs.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading verses live from Qur'an API...</Text>
          </View>
        ) : (
          <FlatList
            data={surah.ayahs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.ayahList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isPlayingThis =
                playback.isPlaying &&
                playback.currentAyah &&
                (playback.currentAyah.id === item.id || playback.currentAyah.number === item.number);
              const isMemorized = Boolean(progress.memorizedAyahs[item.id]);

              return (
                <View style={[styles.ayahCard, isPlayingThis && styles.ayahCardPlaying]}>
                  {/* Card Header */}
                  <View style={styles.ayahCardHeader}>
                    <View style={styles.verseBadge}>
                      <Text style={styles.verseBadgeText}>
                        {surah.number}:{item.number}
                      </Text>
                    </View>

                    <View style={styles.cardHeaderActions}>
                      {isMemorized ? (
                        <View style={styles.memorizedBadge}>
                          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                          <Text style={styles.memorizedText}>Memorized</Text>
                        </View>
                      ) : null}

                      <Pressable
                        style={[styles.playSingleBtn, isPlayingThis && styles.playSingleBtnActive]}
                        onPress={() => handlePlaySingle(item)}
                      >
                        <Ionicons
                          name={isPlayingThis ? 'pause' : 'play'}
                          size={15}
                          color={isPlayingThis ? '#fff' : colors.primary}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {/* Arabic Text */}
                  <Text style={styles.arabicText}>{item.arabic}</Text>

                  {/* English Translation */}
                  {item.translation ? (
                    <Text style={styles.translationText}>{item.translation}</Text>
                  ) : null}
                </View>
              );
            }}
          />
        )}
      </Screen>

      {/* Sticky Bottom Audio Player Bar */}
      <AudioPlayerBar />

      <RepeatSettingsModal
        visible={repeatModalVisible}
        repeatTarget={playback.repeatTarget}
        delaySeconds={playback.delaySeconds}
        isLoopRange={playback.isLoopRange}
        onClose={() => setRepeatModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  navBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySubtle,
  },
  navBackText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  headerArabicTitle: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: '800',
  },
  surahInfoRow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  surahTitleEn: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  surahMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  playAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  playAllText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  repeatHeaderBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  repeatHeaderText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  memorizeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  memorizeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  ayahList: {
    paddingBottom: 40,
  },
  ayahCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  ayahCardPlaying: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: colors.primarySubtle,
  },
  ayahCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  verseBadge: {
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  verseBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memorizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  memorizedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  playSingleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playSingleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  arabicText: {
    fontSize: 24,
    lineHeight: 44,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginVertical: 6,
    fontWeight: '600',
  },
  translationText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
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
