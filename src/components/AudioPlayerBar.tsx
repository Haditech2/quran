import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme';
import {
  cycleRepeat,
  getPlaybackState,
  next,
  PlaybackState,
  prev,
  subscribePlaybackState,
  togglePlay,
} from '@/services/audio';
import RepeatSettingsModal from '@/components/RepeatSettingsModal';

function formatTime(ms: number): string {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function AudioPlayerBar({
  onPressTitle,
}: {
  onPressTitle?: () => void;
}) {
  const [playback, setPlayback] = useState<PlaybackState>(getPlaybackState());
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    return subscribePlaybackState((state) => {
      setPlayback({ ...state });
    });
  }, []);

  if (!playback.currentAyah) {
    return null;
  }

  const { isPlaying, currentAyah, positionMs, durationMs, repeatTarget, currentRepetition, delaySeconds, isLoopRange } = playback;
  const progressPct = durationMs > 0 ? (positionMs / durationMs) * 100 : 0;

  // Format Repeat Badge text
  let badgeText = '1x';
  let badgeBg = colors.border;
  let badgeColor = colors.textMuted;

  if (repeatTarget === Infinity) {
    badgeText = '∞ Ayah';
    badgeBg = colors.accent;
    badgeColor = '#fff';
  } else if (repeatTarget > 1) {
    badgeText = currentRepetition > 1 ? `${repeatTarget}x (${currentRepetition}/${repeatTarget})` : `${repeatTarget}x`;
    badgeBg = colors.primary;
    badgeColor = '#fff';
  } else if (isLoopRange) {
    badgeText = '∞ Surah';
    badgeBg = colors.primary;
    badgeColor = '#fff';
  }

  return (
    <>
      <View style={styles.container}>
        {/* Progress bar line */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>

        <View style={styles.row}>
          {/* Left: Ayah info */}
          <Pressable style={styles.infoLeft} onPress={onPressTitle}>
            <View style={styles.coverBadge}>
              <Ionicons name="volume-medium" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ayahTitle} numberOfLines={1}>
                Ayah {currentAyah.number} ({currentAyah.id})
              </Text>
              <Text style={styles.ayahTime} numberOfLines={1}>
                {formatTime(positionMs)} / {formatTime(durationMs)}
              </Text>
            </View>
          </Pressable>

          {/* Right: Controls */}
          <View style={styles.controlsRight}>
            <Pressable onPress={() => prev()} style={styles.controlBtn} hitSlop={8}>
              <Ionicons name="play-skip-back" size={18} color={colors.text} />
            </Pressable>

            <Pressable onPress={() => togglePlay()} style={styles.playPauseBtn} hitSlop={8}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#fff" />
            </Pressable>

            <Pressable onPress={() => next()} style={styles.controlBtn} hitSlop={8}>
              <Ionicons name="play-skip-forward" size={18} color={colors.text} />
            </Pressable>

            {/* Repeat Button with Real-time Badge */}
            <Pressable
              onPress={() => setModalVisible(true)}
              onLongPress={() => cycleRepeat()}
              style={styles.repeatBtn}
              hitSlop={8}
            >
              <Ionicons
                name="repeat"
                size={18}
                color={repeatTarget > 1 || isLoopRange || repeatTarget === Infinity ? colors.primary : colors.textMuted}
              />
              <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.badgeLabel, { color: badgeColor }]}>{badgeText}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      <RepeatSettingsModal
        visible={modalVisible}
        repeatTarget={repeatTarget}
        delaySeconds={delaySeconds}
        isLoopRange={isLoopRange}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.borderSubtle,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  coverBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayahTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  ayahTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPauseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repeatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    gap: 4,
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
});
